import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Globe, Check, ChevronDown } from 'lucide-react';

export const LanguageSwitcher = ({ theme = 'light', variant = 'dropdown', align = 'auto', className = '' }) => {
  const { language, setLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState(align === 'right' ? 'right' : 'left');
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Compute smart viewport-aware positioning on open
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      if (align !== 'auto') {
        setPlacement(align);
        return;
      }
      const rect = dropdownRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const expectedMenuWidth = 190;
      
      // If opening to the right overflows screen, anchor right; otherwise anchor left
      if (rect.left + expectedMenuWidth > viewportWidth - 12) {
        setPlacement('right');
      } else {
        setPlacement('left');
      }
    }
  }, [isOpen, align]);

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  // Segmented Pill Variant (for Topbar or header bars)
  if (variant === 'segmented') {
    const isDark = theme === 'dark';
    return (
      <div
        className={`lang-switcher-segmented ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          background: isDark ? 'rgba(255, 255, 255, 0.12)' : 'var(--cream)',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid var(--line)',
          borderRadius: '20px',
          padding: '3px',
          gap: '2px'
        }}
      >
        <span style={{ padding: '0 6px', display: 'flex', alignItems: 'center', color: isDark ? 'rgba(255,255,255,0.7)' : 'var(--ink-soft)' }}>
          <Globe size={14} />
        </span>
        {languages.map((l) => {
          const isActive = l.code === language;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => setLanguage(l.code)}
              style={{
                background: isActive ? (isDark ? 'var(--teal)' : 'var(--navy)') : 'transparent',
                color: isActive ? '#FFFFFF' : (isDark ? '#FFFFFF' : 'var(--ink)'),
                border: 'none',
                borderRadius: '16px',
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: isActive ? '700' : '500',
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
            >
              {l.nativeName}
            </button>
          );
        })}
      </div>
    );
  }

  // Dropdown Pill Variant (Default, compact and sleek)
  const isDark = theme === 'dark';

  return (
    <div
      ref={dropdownRef}
      className={`lang-switcher-dropdown ${className}`}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: isDark ? 'rgba(255, 255, 255, 0.12)' : 'var(--cream)',
          color: isDark ? '#FFFFFF' : 'var(--ink)',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.22)' : '1px solid var(--line)',
          borderRadius: '20px',
          padding: '5px 12px',
          fontSize: '12.5px',
          fontWeight: '600',
          cursor: 'pointer',
          backdropFilter: isDark ? 'blur(8px)' : 'none',
          boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
          transition: 'all 0.2s ease'
        }}
        title="Change Language / भाषा बदलें / भाषा बदला"
      >
        <Globe size={14} color={isDark ? '#F5B041' : 'var(--teal)'} />
        <span>{currentLang.nativeName}</span>
        <ChevronDown size={13} style={{ opacity: 0.7, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            ...(placement === 'right' ? { right: 0 } : { left: 0 }),
            zIndex: 1000,
            background: '#FFFFFF',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            padding: '6px',
            minWidth: '175px',
            maxWidth: 'calc(100vw - 24px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          <div style={{ padding: '6px 10px 4px', fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
            Select Language
          </div>

          {languages.map((l) => {
            const isSelected = l.code === language;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => {
                  setLanguage(l.code);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 10px',
                  background: isSelected ? 'rgba(22, 60, 86, 0.08)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '13px',
                  fontWeight: isSelected ? '700' : '500',
                  color: isSelected ? 'var(--navy)' : 'var(--ink)',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{l.flag}</span>
                  <span>{l.nativeName}</span>
                  {l.code !== 'en' && <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>({l.name})</span>}
                </div>
                {isSelected && <Check size={14} color="var(--teal)" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
