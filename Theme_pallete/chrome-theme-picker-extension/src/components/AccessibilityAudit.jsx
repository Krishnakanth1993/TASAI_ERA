import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiAlertCircle, FiXCircle, FiInfo } from 'react-icons/fi';

export default function AccessibilityAudit({ colors }) {
  const [contrastResults, setContrastResults] = useState([]);
  const [overallScore, setOverallScore] = useState(0);

  useEffect(() => {
    if (colors.length > 0) {
      analyzeAccessibility();
    }
  }, [colors]);

  const analyzeAccessibility = () => {
    const results = [];
    let totalScore = 0;
    let testCount = 0;

    // Test color combinations
    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        const color1 = colors[i];
        const color2 = colors[j];
        
        const contrast = calculateContrastRatio(color1, color2);
        const wcagResults = checkWCAGCompliance(contrast);
        
        results.push({
          color1,
          color2,
          contrast,
          wcagResults,
          score: calculateScore(wcagResults)
        });
        
        totalScore += calculateScore(wcagResults);
        testCount++;
      }
    }

    // Test individual colors for readability on white/black backgrounds
    colors.forEach(color => {
      const whiteContrast = calculateContrastRatio(color, '#ffffff');
      const blackContrast = calculateContrastRatio(color, '#000000');
      
      const whiteWCAG = checkWCAGCompliance(whiteContrast);
      const blackWCAG = checkWCAGCompliance(blackContrast);
      
      results.push({
        color1: color,
        color2: '#ffffff',
        contrast: whiteContrast,
        wcagResults: whiteWCAG,
        score: calculateScore(whiteWCAG),
        type: 'white-background'
      });
      
      results.push({
        color1: color,
        color2: '#000000',
        contrast: blackContrast,
        wcagResults: blackWCAG,
        score: calculateScore(blackWCAG),
        type: 'black-background'
      });
      
      totalScore += calculateScore(whiteWCAG) + calculateScore(blackWCAG);
      testCount += 2;
    });

    setContrastResults(results);
    setOverallScore(testCount > 0 ? Math.round((totalScore / testCount) * 100) : 0);
  };

  const calculateContrastRatio = (color1, color2) => {
    const luminance1 = getLuminance(color1);
    const luminance2 = getLuminance(color2);
    
    const lighter = Math.max(luminance1, luminance2);
    const darker = Math.min(luminance1, luminance2);
    
    return (lighter + 0.05) / (darker + 0.05);
  };

  const getLuminance = (color) => {
    const rgb = hexToRgb(color);
    if (!rgb) return 0;
    
    const { r, g, b } = rgb;
    
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const checkWCAGCompliance = (contrast) => {
    return {
      AA: {
        large: contrast >= 3.0,
        normal: contrast >= 4.5
      },
      AAA: {
        large: contrast >= 4.5,
        normal: contrast >= 7.0
      }
    };
  };

  const calculateScore = (wcagResults) => {
    let score = 0;
    
    if (wcagResults.AA.normal) score += 2;
    if (wcagResults.AA.large) score += 1;
    if (wcagResults.AAA.normal) score += 2;
    if (wcagResults.AAA.large) score += 1;
    
    return score;
  };

  const getContrastScore = (contrast) => {
    if (contrast >= 7.0) return { level: 'excellent', color: '#28a745', icon: <FiCheckCircle /> };
    if (contrast >= 4.5) return { level: 'good', color: '#17a2b8', icon: <FiCheckCircle /> };
    if (contrast >= 3.0) return { level: 'fair', color: '#ffc107', icon: <FiAlertCircle /> };
    return { level: 'poor', color: '#dc3545', icon: <FiXCircle /> };
  };

  const getWCAGStatus = (wcagResults) => {
    const status = [];
    
    if (wcagResults.AA.normal) status.push('AA Normal');
    if (wcagResults.AA.large) status.push('AA Large');
    if (wcagResults.AAA.normal) status.push('AAA Normal');
    if (wcagResults.AAA.large) status.push('AAA Large');
    
    return status.length > 0 ? status.join(', ') : 'Fails WCAG';
  };

  if (colors.length === 0) {
    return (
      <div className="accessibility-audit">
        <h3>Accessibility Audit</h3>
        <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>
          Select colors to analyze accessibility and contrast ratios
        </p>
      </div>
    );
  }

  return (
    <div className="accessibility-audit">
      <h3>Accessibility Audit</h3>
      
      <div style={{ 
        background: '#f8f9fa', 
        padding: '16px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '1px solid #e9ecef'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <FiInfo style={{ color: '#667eea' }} />
          <strong>Overall Accessibility Score</strong>
        </div>
        <div style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          color: overallScore >= 80 ? '#28a745' : overallScore >= 60 ? '#ffc107' : '#dc3545'
        }}>
          {overallScore}%
        </div>
        <div style={{ fontSize: '12px', color: '#6c757d' }}>
          Based on {contrastResults.length} color combinations tested
        </div>
      </div>

      <div className="contrast-results">
        {contrastResults.map((result, index) => {
          const contrastScore = getContrastScore(result.contrast);
          const wcagStatus = getWCAGStatus(result.wcagResults);
          
          return (
            <div key={index} className="contrast-check" style={{ 
              background: '#ffffff', 
              borderRadius: '8px', 
              padding: '16px', 
              marginBottom: '12px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '20px', 
                    height: '20px', 
                    background: result.color1, 
                    borderRadius: '4px',
                    border: '1px solid #e9ecef'
                  }} />
                  <span style={{ color: '#6c757d' }}>vs</span>
                  <div style={{ 
                    width: '20px', 
                    height: '20px', 
                    background: result.color2, 
                    borderRadius: '4px',
                    border: '1px solid #e9ecef'
                  }} />
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ 
                    color: contrastScore.color, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    fontSize: '14px'
                  }}>
                    {contrastScore.icon}
                    {contrastScore.level}
                  </span>
                  <span className="contrast-score" style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: contrastScore.color,
                    color: '#ffffff'
                  }}>
                    {result.contrast.toFixed(2):1}
                  </span>
                </div>
              </div>
              
              <div style={{ fontSize: '12px', color: '#6c757d' }}>
                <strong>WCAG Status:</strong> {wcagStatus}
                {result.type && (
                  <span style={{ marginLeft: '8px' }}>
                    • {result.type === 'white-background' ? 'On white background' : 'On black background'}
                  </span>
                )}
              </div>
              
              {result.contrast < 4.5 && (
                <div style={{ 
                  marginTop: '8px', 
                  padding: '8px', 
                  background: '#fff3cd', 
                  border: '1px solid #ffeaa7',
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: '#856404'
                }}>
                  <strong>Recommendation:</strong> This contrast ratio may be too low for normal text. 
                  Consider using larger font sizes or adjusting colors for better readability.
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#6c757d' }}>
        <strong>WCAG Guidelines:</strong>
        <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
          <li><strong>AA Normal:</strong> 4.5:1 contrast ratio for normal text</li>
          <li><strong>AA Large:</strong> 3:1 contrast ratio for large text (18pt+)</li>
          <li><strong>AAA Normal:</strong> 7:1 contrast ratio for normal text</li>
          <li><strong>AAA Large:</strong> 4.5:1 contrast ratio for large text</li>
        </ul>
      </div>
    </div>
  );
}
