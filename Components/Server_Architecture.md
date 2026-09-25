# Server Architecture & Deployment

Die empfohlene Bereitstellungs-Architektur fr den Produktivbetrieb auf einem Linux-Server basiert auf **Nginx** (Reverse Proxy) und **Systemd** (Prozessmanager).

## Architektur-Skizze

```mermaid
graph TD
    Client[Webbrowser / Stabe / Tablets] -->|HTTP/HTTPS / WS| Nginx[Nginx Webserver]
    
    subgraph Server [Linux Server (z.B. Debian/Ubuntu)]
        Nginx -->|Statische Dateien| Dist[/frontend/dist/]
        Nginx -->|Proxy_Pass localhost:8000| FastAPI[Python FastAPI Backend]
    end
    
    FastAPI -->|HTTPS GET| DWD[Open-Meteo DWD-ICON API]
    FastAPI -->|HTTPS GET| WSV[Pegelonline API]
```

## Nginx Konfiguration (Empfehlung)
Nginx dient als Single-Point-of-Entry. Er serviert die schnellen statischen React-Dateien und leitet API-Aufrufe sowie WebSockets an Python weiter.

```nginx
server {
    listen 80;
    server_name dashboard.kats.local;

    # Statische React-Dateien
    location / {
        root /path/to/BetterDashboard/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # REST API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSockets
    location /ws {
        proxy_pass http://127.0.0.1:8000/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## Python Daemon
Das FastAPI-Backend sollte via Systemd oder PM2 als Hintergrunddienst gestartet werden:
`uvicorn main:app --host 127.0.0.1 --port 8000`
