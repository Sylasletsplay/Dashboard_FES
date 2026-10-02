import { useEffect, useState } from 'react';

export function useScale() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      setScale(Math.min(1.4, Math.max(0.55, Math.min(window.innerWidth / 1536, window.innerHeight / 864))));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return scale;
}
