import React, { useMemo, useState, useRef } from 'react';
import { jsPDF } from 'jspdf';

/**
 * Tooltip component with help icon
 */
const Tooltip = ({ text }) => (
  <span title={text} style={{ cursor: "help", color: "#4299e1", marginLeft: "4px" }}>
    ⓘ
  </span>
);

const SCALE_MIN = 1;
const SCALE_MAX = 7;

export default function Estimator() {
  // Brand name state
  const [brandName, setBrandName] = useState("");

  // Category weights
  const [categoryWeights, setCategoryWeights] = useState({
    marketing: 33.33,
    creative: 33.33,
    media: 33.34,
  });

  // Factors state
  const [factors, setFactors] = useState({
    marketing: [
      { name: "Brand Lifestage", low: "Established", high: "New", score: 4, tip: "New brands need more repetition to build memory." },
      { name: "Market Share", low: "High", high: "Low", score: 4, tip: "Low-share brands need higher frequency to compete." },
      { name: "Brand Loyalty", low: "High", high: "Low", score: 4, tip: "Low loyalty increases persuasion difficulty." },
      { name: "Purchase Cycle", low: "Long", high: "Short", score: 4, tip: "Short cycles require fewer exposures." },
      { name: "Frequency of Usage", low: "Less", high: "More", score: 4, tip: "Frequently used products benefit from reminders." },
      { name: "Age of Audience", low: "Young", high: "Old / Children", score: 4, tip: "Older or very young audiences require repetition." },
      { name: "Competitive Activity (SOV)", low: "Low", high: "High", score: 4, tip: "High competitive noise increases frequency need." },
      { name: "Habits / Attitude", low: "Reinforce", high: "Change", score: 4, tip: "Changing habits requires more exposures." },
      { name: "Competitive Threat", low: "Low", high: "High", score: 4, tip: "Aggressive competitors demand higher frequency." },
    ],
    creative: [
      { name: "Message Complexity", low: "Simple", high: "Complex", score: 4, tip: "Complex messages require repetition to understand." },
      { name: "Message Uniqueness", low: "Established", high: "New", score: 4, tip: "New propositions need reinforcement." },
      { name: "Continuing Campaign", low: "Established", high: "New", score: 4, tip: "New campaigns need higher learning." },
      { name: "Message Skew", low: "Product", high: "Image", score: 4, tip: "Image-based messages often need repetition." },
      { name: "Message Variety", low: "Low", high: "High", score: 4, tip: "More creatives reduce wearout." },
      { name: "Wearout", low: "High", high: "Low", score: 4, tip: "Fast wearout needs more frequency." },
      { name: "Ad Unit Size", low: "Large", high: "Small", score: 4, tip: "Smaller ads need repetition." },
    ],
    media: [
      { name: "Ad Clutter", low: "Low", high: "High", score: 4, tip: "Cluttered environments need repetition." },
      { name: "Ad Environment", low: "Compatible", high: "Incompatible", score: 4, tip: "Poor context reduces effectiveness." },
      { name: "Audience Attentiveness", low: "High", high: "Low", score: 4, tip: "Low attention requires frequency." },
      { name: "Scheduling", low: "Continuous", high: "Flighting", score: 4, tip: "Flighting needs higher spot pressure." },
      { name: "Repeat Exposure Media", low: "High", high: "Low", score: 4, tip: "Low repetition media needs frequency." },
      { name: "Media Mix", low: "Mix", high: "Single", score: 4, tip: "Single medium increases repetition need." },
    ],
  });

  // Success message state
  const [showSuccess, setShowSuccess] = useState(false);
  const pdfRef = useRef(null);

  // Validation
  const weightSum = Object.values(categoryWeights).reduce((a, b) => a + b, 0);
  const weightValid = Math.abs(weightSum - 100) < 0.01;

  // Frequency Calculation
  const frequency = useMemo(() => {
    let total = 0;
    Object.entries(factors).forEach(([cat, list]) => {
      const catWeight = categoryWeights[cat];
      const perFactorWeight = catWeight / list.length;
      list.forEach(f => {
        total += f.score * (perFactorWeight / 100);
      });
    });
    return total.toFixed(2);
  }, [factors, categoryWeights]);

  // Handlers
  const updateFactor = (cat, idx, key, value) => {
    setFactors(prev => {
      const copy = { ...prev };
      copy[cat][idx][key] = value;
      return copy;
    });
  };

  const addFactor = (cat) => {
    setFactors(prev => ({
      ...prev,
      [cat]: [
        ...prev[cat],
        { name: "New Factor", low: "Low", high: "High", score: 4, tip: "Newly added factor." }
      ],
    }));
  };

  const deleteFactor = (cat, idx) => {
    setFactors(prev => ({
      ...prev,
      [cat]: prev[cat].filter((_, i) => i !== idx),
    }));
  };

  // Download PDF
  const downloadPDF = () => {
    if (!weightValid) {
      alert("Please fix weight issues before downloading PDF.");
      return;
    }

    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const drawHeader = () => {
      // 🔑 RESET STATE (VERY IMPORTANT)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0); // brand blue

      const headerY = 18;

      // Logo
      try {
        const logo = new Image();
        logo.src = "/company-logo.png";

        const imgProps = doc.getImageProperties(logo);

        // choose ONE dimension only
        const logoWidth = 15; // adjust this if needed
        const logoHeight = (imgProps.height * logoWidth) / imgProps.width;

        doc.addImage(
          logo,
          imgProps.fileType,
          pageWidth / 2 - logoWidth - 20, // left of text
          headerY - logoHeight + 1,
          logoWidth,
          logoHeight
        );
      } catch (e) {}

      // Company name
      doc.text(
        "Media Factory (PVT) LTD",
        pageWidth / 2 - 15,
        headerY,
        { align: "left" }
      );

      // Divider
      doc.setDrawColor(226, 232, 240);
      doc.line(20, 28, pageWidth - 20, 28);

      // 🔑 RESET BODY COLOR FOR PAGE CONTENT
      doc.setTextColor(45, 55, 72);
    };

    // Footer (rights reserved)
    const drawFooter = () => {
      doc.setFontSize(9);
      doc.setTextColor(160, 174, 192);
      doc.text(
        "© " + new Date().getFullYear() + " Media Factory (PVT) LTD. All rights reserved.",
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
    };

    drawHeader();
    drawFooter();

    // Title and brand
    doc.setFontSize(20);
    doc.setTextColor(45, 55, 72);
    doc.text("Frequency Estimation Report", 105, 42, { align: "center" });

    // Brand and frequency
    doc.setFontSize(14);
    doc.setTextColor(102, 102, 102);
    doc.text(`Brand: ${brandName || "Not specified"}`, 105, 52, { align: "center" });

    doc.setFontSize(16);
    doc.setTextColor(66, 153, 225);
    doc.text(`Desired Effective Frequency: ${frequency}`, 105, 62, { align: "center" });

    // Category weights table (2 rows)
    doc.setFontSize(12);
    doc.setTextColor(45, 55, 72);

    // Table headers
    let yPos = 80;
    doc.text("Category", 20, yPos);
    doc.text("Weight (%)", 100, yPos);

    yPos += 7;
    doc.line(20, yPos, 180, yPos);

    // Table content
    yPos += 10;
    Object.entries(categoryWeights).forEach(([cat, weight]) => {
      doc.text(cat.charAt(0).toUpperCase() + cat.slice(1), 20, yPos);
      doc.text(weight.toFixed(2).toString(), 100, yPos);
      yPos += 10;
    });

    // Factors table with 3 columns
    yPos += 15;

    Object.entries(factors).forEach(([cat, list]) => {
      // Add category header row
      if (yPos > 250) {
        doc.addPage();
        drawHeader();
        drawFooter();

        // 🔑 reset text color AFTER footer
        doc.setTextColor(45, 55, 72);

        yPos = 40;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(cat.charAt(0).toUpperCase() + cat.slice(1) + " Factors", 20, yPos);
      yPos += 8;
      doc.line(20, yPos, 180, yPos);
      yPos += 10;

      // Table headers for factors
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Sub-category", 20, yPos);
      doc.text("Score (1-7)", 110, yPos);
      doc.text("Weight (%)", 160, yPos);

      yPos += 6;
      doc.line(20, yPos, 180, yPos);
      yPos += 10;

      // Factor rows
      list.forEach((f, i) => {
        if (yPos > 270) {
        doc.addPage();
        drawHeader();
        drawFooter();

        // 🔑 reset text color AFTER footer
        doc.setTextColor(45, 55, 72);

        yPos = 40;
          // Add headers again on new page
          doc.setFontSize(10);
          doc.text("Sub-category", 20, yPos);
          doc.text("Score (1-7)", 110, yPos);
          doc.text("Weight (%)", 160, yPos);
          yPos += 16;
        }

        const factorWeight = (categoryWeights[cat] / list.length).toFixed(2);
        doc.text(f.name, 20, yPos);
        doc.text(f.score.toString(), 110, yPos);
        doc.text(factorWeight.toString(), 160, yPos);
        yPos += 8;
      });

      yPos += 10; // Space between categories
    });

    // Save PDF
    const fileName = `frequency-estimation-${brandName || 'report'}-${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);

    // Show success message
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // Render helper
  const renderCategory = (catKey, title) => {
    const list = factors[catKey];
    const perWeight = (categoryWeights[catKey] / list.length).toFixed(2);

    return (
      <div style={styles.categoryCard}>
        <div style={styles.categoryHeader}>
          <h3 style={styles.categoryTitle}>{title}</h3>
          <div style={styles.categoryActions}>
            <span style={styles.weightBadge}>
              Category Weight: {categoryWeights[catKey].toFixed(2)}%
            </span>
            <button
              type="button"
              onClick={() => addFactor(catKey)}
              style={styles.addButton}
            >
              + Add Sub Factor
            </button>
          </div>
        </div>

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Factor</th>
                <th style={styles.tableHeader}>Lower</th>
                <th style={styles.tableHeader}>Score (1–7)</th>
                <th style={styles.tableHeader}>Upper</th>
                <th style={styles.tableHeader}>Weight %</th>
                <th style={styles.tableHeader}></th>
              </tr>
            </thead>
            <tbody>
              {list.map((f, i) => (
                <tr key={i} style={styles.tableRow}>
                  <td style={styles.tableCell}>
                    <input
                      value={f.name}
                      onChange={e => updateFactor(catKey, i, "name", e.target.value)}
                      style={styles.input}
                    />
                    <Tooltip text={f.tip} />
                  </td>
                  <td style={styles.tableCell}>
                    <input
                      value={f.low}
                      onChange={e => updateFactor(catKey, i, "low", e.target.value)}
                      style={styles.input}
                    />
                  </td>
                  <td style={styles.tableCell}>
                    <div style={styles.scoreContainer}>
                      <input
                        type="range"
                        min={SCALE_MIN}
                        max={SCALE_MAX}
                        value={f.score}
                        onChange={e => updateFactor(catKey, i, "score", Number(e.target.value))}
                        style={styles.slider}
                      />
                      <span style={styles.scoreValue}>{f.score}</span>
                    </div>
                  </td>
                  <td style={styles.tableCell}>
                    <input
                      value={f.high}
                      onChange={e => updateFactor(catKey, i, "high", e.target.value)}
                      style={styles.input}
                    />
                  </td>
                  <td style={styles.tableCell}>
                    <span style={styles.weightValue}>{perWeight}</span>
                  </td>
                  <td style={styles.tableCell}>
                    <button
                      onClick={() => deleteFactor(catKey, i)}
                      style={styles.deleteButton}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* Success Message */}
      {showSuccess && (
        <div style={styles.successMessage}>
          ✓ PDF successfully downloaded!
        </div>
      )}

      {/* Main Content */}
      <div style={styles.content}>
        {/* Title Section */}
        <div style={styles.titleSection}>
          <h1 style={styles.mainTitle}>Joseph W. Ostrow – Frequency Estimator Model 1982</h1>
          <p style={styles.subTitle}>Judgment-based effective frequency estimation (Adapted model)</p>
        </div>

        {/* Brand and Frequency Container */}
        <div style={styles.topContainer}>
          <div style={styles.brandSection}>
            <label style={styles.brandLabel}>
              Brand Name:
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Enter brand name"
                style={styles.brandInput}
              />
            </label>

            {/* Category Weights */}
            <div style={styles.weightsSection}>
              <h4 style={styles.weightsTitle}>Category Weights (%)</h4>
              <div style={styles.weightsGrid}>
                {Object.entries(categoryWeights).map(([key, value]) => (
                  <div key={key} style={styles.weightInputGroup}>
                    <label style={styles.weightLabel}>
                      {key.toUpperCase()}:
                    </label>
                    <input
                      type="number"
                      value={value}
                      onChange={e => setCategoryWeights({
                        ...categoryWeights,
                        [key]: Number(e.target.value)
                      })}
                      style={styles.numberInput}
                      step="0.01"
                      min="0"
                      max="100"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Frequency Result */}
          <div style={styles.resultSection}>
            <h3 style={styles.resultTitle}>Desired Effective Frequency</h3>
            <div style={styles.resultValueContainer}>
              <span style={styles.resultValue}>
                {weightValid ? frequency : "Invalid Weights"}
              </span>
              <div style={styles.weightStatus}>
                <span style={weightValid ? styles.validText : styles.invalidText}>
                  Total Weights: {weightSum.toFixed(2)}%
                </span>
                {!weightValid && (
                  <span style={styles.errorText}> (Must sum to 100%)</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div ref={pdfRef}>
          {renderCategory("marketing", "Marketing Factors")}
          {renderCategory("creative", "Creative Factors")}
          {renderCategory("media", "Media Factors")}
        </div>

        {/* Action Buttons */}
        <div style={styles.actionButtons}>
          <button
            onClick={downloadPDF}
            disabled={!weightValid}
            style={weightValid ? styles.downloadButton : styles.downloadButtonDisabled}
          >
            Download PDF Report
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#d5e9f7',
    padding: '0',
  },
  content: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '20px',
  },
  titleSection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
    textAlign: 'center',
  },
  mainTitle: {
    margin: '0',
    color: '#2d3748',
    fontSize: '24px',
    fontWeight: '600',
  },
  subTitle: {
    margin: '8px 0 0 0',
    color: '#718096',
    fontSize: '14px',
    fontStyle: 'italic',
  },
  topContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '20px',
  },
  brandSection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
  },
  brandLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    color: '#4a5568',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '20px',
  },
  brandInput: {
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '14px',
    width: '95%',
    transition: 'all 0.2s ease',
  },
  weightsSection: {
    marginTop: '20px',
  },
  weightsTitle: {
    margin: '0 0 12px 0',
    color: '#2d3748',
    fontSize: '16px',
    fontWeight: '600',
  },
  weightsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '12px',
  },
  weightInputGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  weightLabel: {
    color: '#4a5568',
    fontSize: '14px',
    fontWeight: '500',
    minWidth: '80px',
  },
  numberInput: {
    padding: '8px 10px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '14px',
    width: '100px',
    transition: 'all 0.2s ease',
  },
  resultSection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  resultTitle: {
    margin: '0 0 12px 0',
    color: '#4a5568',
    fontSize: '16px',
    fontWeight: '500',
  },
  resultValueContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  resultValue: {
    fontSize: '32px',
    fontWeight: '600',
    color: '#4299e1',
  },
  weightStatus: {
    fontSize: '12px',
  },
  validText: {
    color: '#48bb78',
    fontWeight: '500',
  },
  invalidText: {
    color: '#f56565',
    fontWeight: '500',
  },
  errorText: {
    color: '#f56565',
  },
  categoryCard: {
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
  },
  categoryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  categoryTitle: {
    margin: '0',
    color: '#2d3748',
    fontSize: '18px',
    fontWeight: '600',
  },
  categoryActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  weightBadge: {
    backgroundColor: '#edf2f7',
    color: '#4a5568',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
  },
  addButton: {
    padding: '6px 12px',
    backgroundColor: '#4299e1',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  tableContainer: {
    overflowX: 'auto',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  tableHeader: {
    padding: '12px 8px',
    textAlign: 'left',
    backgroundColor: '#f7fafc',
    color: '#4a5568',
    fontWeight: '600',
    borderBottom: '1px solid #e2e8f0',
    whiteSpace: 'nowrap',
  },
  tableRow: {
    borderBottom: '1px solid #e2e8f0',
  },
  tableCell: {
    padding: '10px 8px',
    color: '#4a5568',
    verticalAlign: 'middle',
  },
  input: {
    padding: '6px 8px',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    fontSize: '13px',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
  },
  scoreContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  slider: {
    flex: 1,
    height: '4px',
    borderRadius: '2px',
    backgroundColor: '#e2e8f0',
    outline: 'none',
    appearance: 'none',
    cursor: 'pointer',
  },
  scoreValue: {
    minWidth: '24px',
    textAlign: 'center',
    fontWeight: '600',
    color: '#4299e1',
    fontSize: '13px',
  },
  weightValue: {
    fontWeight: '600',
    color: '#2d3748',
    fontSize: '13px',
  },
  deleteButton: {
    padding: '4px 8px',
    backgroundColor: '#fed7d7',
    color: '#c53030',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  actionButtons: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '30px',
    marginBottom: '30px',
  },
  downloadButton: {
    padding: '12px 24px',
    backgroundColor: '#48bb78',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  downloadButtonDisabled: {
    padding: '12px 24px',
    backgroundColor: '#a0aec0',
    color: '#e2e8f0',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'not-allowed',
  },
  successMessage: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    backgroundColor: '#48bb78',
    color: 'white',
    padding: '12px 20px',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 1000,
    animation: 'slideIn 0.3s ease',
  },
};