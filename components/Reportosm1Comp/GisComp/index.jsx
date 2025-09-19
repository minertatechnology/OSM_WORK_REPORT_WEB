import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';

const DynamicGisComp = dynamic(() => import('./GisComp'), {
  ssr: false,
  loading: () => (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '18px',
      color: '#666'
    }}>
      กำลังโหลดแผนที่...
    </div>
  )
});

const GisCompWrapper = () => {
  const [mounted, setMounted] = useState(false);

  // Make sure component only renders on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        กำลังโหลดแผนที่...
      </div>
    );
  }

  return <DynamicGisComp />;
};

export default GisCompWrapper;