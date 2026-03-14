import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineArrowRight, HiOutlineArrowLeft, HiOutlineX, HiOutlineSparkles } from 'react-icons/hi';

const TOUR_STEPS = [
  {
    title: '👋 Welcome to KOSHNETRA!',
    description: 'Let us give you a quick tour of your brand-new Inventory Management System. We\'ll walk you through all the key features in just a few steps!',
    target: null, // Full-screen welcome
    position: 'center',
  },
  {
    title: '📊 Dashboard Overview',
    description: 'This is your command center! View real-time KPIs like Sales, Purchases, Deliveries, and Transfer metrics at a glance.',
    target: '.sub-header',
    position: 'bottom',
  },
  {
    title: '📦 Operation Summaries',
    description: 'These cards show you the current state of your Receipts, Deliveries, and Internal Transfers. Click any card to jump directly to that section!',
    target: '.op-card',
    position: 'bottom',
  },
  {
    title: '📈 Stock Metrics',
    description: 'Track your Total Products, Total Stock, Low Stock alerts, Out of Stock items, and the number of Warehouses — all updated in real-time.',
    target: '.grid.grid-cols-2.lg\\:grid-cols-5',
    position: 'top',
  },
  {
    title: '🔔 Notifications',
    description: 'Stay on top of important events! The bell icon shows you low-stock alerts, validation updates, and more. Unread notifications pulse in red.',
    target: '[class*="relative mr-2"]',
    position: 'bottom-left',
  },
  {
    title: '🧭 Navigation',
    description: 'Use the top menu to navigate between Dashboard, Operations (Receipts, Deliveries, Transfers, Adjustments), Products, Move History, and Settings.',
    target: '.hidden.md\\:flex',
    position: 'bottom',
  },
  {
    title: '🤖 AI Assistant',
    description: 'Need help? Click the chat bubble at the bottom-right to talk with KOSHNETRA\'s AI assistant. Ask about inventory management, features, or get quick guidance!',
    target: null,
    position: 'center',
  },
  {
    title: '🚀 You\'re All Set!',
    description: 'You\'re ready to manage your inventory like a pro! Start by adding products, setting up warehouses, and recording your first receipt. Happy managing!',
    target: null,
    position: 'center',
  },
];

const OnboardingTour = ({ userId, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [highlightStyle, setHighlightStyle] = useState({});
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const overlayRef = useRef(null);

  const step = TOUR_STEPS[currentStep];

  const positionTooltip = useCallback(() => {
    if (!step.target || step.position === 'center') {
      setTooltipStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10002,
      });
      setHighlightStyle({ display: 'none' });
      return;
    }

    const el = document.querySelector(step.target);
    if (!el) {
      setTooltipStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10002,
      });
      setHighlightStyle({ display: 'none' });
      return;
    }

    const rect = el.getBoundingClientRect();
    const pad = 8;

    // Highlight box around the target element
    setHighlightStyle({
      display: 'block',
      position: 'fixed',
      top: rect.top - pad,
      left: rect.left - pad,
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
      borderRadius: '12px',
      border: '2px solid rgba(244, 63, 94, 0.7)',
      boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.55), 0 0 20px rgba(244, 63, 94, 0.3)',
      zIndex: 10001,
      pointerEvents: 'none',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    });

    // Position tooltip near the element
    const tooltip = {};
    const tooltipW = 380;
    const tooltipH = 220;

    switch (step.position) {
      case 'bottom':
        tooltip.top = rect.bottom + pad + 12;
        tooltip.left = Math.max(16, Math.min(rect.left + rect.width / 2 - tooltipW / 2, window.innerWidth - tooltipW - 16));
        break;
      case 'top':
        tooltip.top = rect.top - tooltipH - pad - 12;
        tooltip.left = Math.max(16, Math.min(rect.left + rect.width / 2 - tooltipW / 2, window.innerWidth - tooltipW - 16));
        break;
      case 'bottom-left':
        tooltip.top = rect.bottom + pad + 12;
        tooltip.left = Math.max(16, rect.right - tooltipW);
        break;
      default:
        tooltip.top = rect.bottom + pad + 12;
        tooltip.left = Math.max(16, rect.left);
    }

    // Keep on screen
    if (tooltip.top + tooltipH > window.innerHeight) {
      tooltip.top = rect.top - tooltipH - pad - 12;
    }
    if (tooltip.top < 10) tooltip.top = 10;

    setTooltipStyle({
      position: 'fixed',
      top: tooltip.top,
      left: tooltip.left,
      zIndex: 10002,
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    });
  }, [step]);

  useEffect(() => {
    positionTooltip();
    const handleResize = () => positionTooltip();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [currentStep, positionTooltip]);

  // Scroll target into view
  useEffect(() => {
    if (step.target && step.position !== 'center') {
      const el = document.querySelector(step.target);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Reposition after scroll
        setTimeout(positionTooltip, 500);
      }
    }
  }, [currentStep, step, positionTooltip]);

  const goNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(s => s + 1);
        setIsAnimating(false);
      }, 200);
    } else {
      completeTour();
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(s => s - 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const completeTour = () => {
    setIsVisible(false);
    if (userId) {
      localStorage.setItem(`koshnetra_tour_completed_${userId}`, 'true');
    } else {
      localStorage.setItem('koshnetra_tour_completed', 'true');
    }
    if (onComplete) onComplete();
  };

  const skipTour = () => {
    completeTour();
  };

  if (!isVisible) return null;

  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;
  const isFirst = currentStep === 0;
  const isLast = currentStep === TOUR_STEPS.length - 1;
  const isWelcome = step.position === 'center';

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          background: isWelcome ? 'rgba(15, 23, 42, 0.7)' : 'transparent',
          backdropFilter: isWelcome ? 'blur(2px)' : 'none',
          transition: 'all 0.4s ease',
          pointerEvents: 'auto',
        }}
        onClick={(e) => {
          if (e.target === overlayRef.current) return; // Don't skip on overlay click
        }}
      />

      {/* Highlight Box */}
      {!isWelcome && <div style={highlightStyle} />}

      {/* Tooltip Card */}
      <div
        style={{
          ...tooltipStyle,
          opacity: isAnimating ? 0 : 1,
          transform: isAnimating
            ? `${tooltipStyle.transform || ''} scale(0.95)`
            : `${tooltipStyle.transform || ''} scale(1)`,
          transition: 'opacity 0.2s ease, transform 0.3s ease',
        }}
      >
        <div
          style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)',
            width: isWelcome ? '420px' : '380px',
            overflow: 'hidden',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {/* Progress bar */}
          <div style={{ height: '3px', background: '#f1f5f9'}}>
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #f43f5e, #e11d48)',
                borderRadius: '0 3px 3px 0',
                transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </div>

          {/* Content */}
          <div style={{ padding: isWelcome ? '28px 28px 20px' : '20px 24px 16px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <h3 style={{
                fontSize: isWelcome ? '20px' : '16px',
                fontWeight: 700,
                color: '#1f2937',
                margin: 0,
                lineHeight: 1.3,
              }}>
                {step.title}
              </h3>
              <button
                onClick={skipTour}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  color: '#9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  marginLeft: '8px',
                  flexShrink: 0,
                }}
                onMouseOver={e => e.currentTarget.style.background = '#f3f4f6'}
                onMouseOut={e => e.currentTarget.style.background = 'none'}
                title="Skip tour"
              >
                <HiOutlineX size={18} />
              </button>
            </div>

            {/* Description */}
            <p style={{
              fontSize: '13.5px',
              color: '#6b7280',
              lineHeight: 1.65,
              margin: '0 0 16px 0',
            }}>
              {step.description}
            </p>

            {/* Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #f3f4f6',
              paddingTop: '14px',
            }}>
              {/* Step counter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {TOUR_STEPS.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: i === currentStep ? '20px' : '7px',
                      height: '7px',
                      borderRadius: '10px',
                      background: i === currentStep
                        ? 'linear-gradient(90deg, #f43f5e, #e11d48)'
                        : i < currentStep
                          ? '#fda4af'
                          : '#e5e7eb',
                      transition: 'all 0.3s ease',
                    }}
                  />
                ))}
              </div>

              {/* Navigation buttons */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {!isLast && (
                  <button
                    onClick={skipTour}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '7px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'none',
                      color: '#9ca3af',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      marginRight: '4px',
                    }}
                    onMouseOver={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2'; }}
                    onMouseOut={e => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'none'; }}
                  >
                    Skip Tour
                  </button>
                )}
                {!isFirst && (
                  <button
                    onClick={goPrev}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '7px 14px',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      background: 'white',
                      color: '#6b7280',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#d1d5db'; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                  >
                    <HiOutlineArrowLeft size={14} />
                    Back
                  </button>
                )}
                <button
                  onClick={goNext}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '7px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(244, 63, 94, 0.3)',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(244, 63, 94, 0.4)'; }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(244, 63, 94, 0.3)'; }}
                >
                  {isFirst ? (
                    <>
                      Let's Go! <HiOutlineSparkles size={14} />
                    </>
                  ) : isLast ? (
                    <>
                      Finish Tour <HiOutlineSparkles size={14} />
                    </>
                  ) : (
                    <>
                      Next <HiOutlineArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OnboardingTour;
