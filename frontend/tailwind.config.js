/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        kats: {
          bg: {
            dark: '#0b0f19',
            darker: '#070a10',
            light: '#f1f5f9',
            lighter: '#ffffff',
          },
          panel: {
            dark: '#111827',
            light: '#ffffff',
            borderDark: '#1f2937',
            borderLight: '#e2e8f0',
          },
          fms: {
            1: '#10b981', // Status 1: Frei Funk (Grün)
            2: '#0ea5e9', // Status 2: Frei Wache (Cyan/Blau)
            3: '#eab308', // Status 3: Einsatzfahrt (Gelb)
            4: '#ef4444', // Status 4: Am Einsatzort (Rot)
            5: '#f97316', // Status 5: Sprechwunsch (Orange)
            6: '#6b7280', // Status 6: Nicht einsatzbereit (Grau)
          },
          org: {
            fw: '#dc2626',   // Feuerwehr (Rot)
            thw: '#1d4ed8',  // THW (Blau)
            rd: '#059669',   // Rettungsdienst (Grün)
            dlrg: '#eab308', // DLRG (Gelb)
            kats: '#7c3aed', // Führungsstab (Lila)
          }
        }
      }
    },
  },
  plugins: [],
}
