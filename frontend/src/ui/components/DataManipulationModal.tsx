import React, { useState, useEffect } from 'react';
import './DataManipulationModal.css';
import { 
  DataManipulationModalProps, 
  ManipulationFormData,
  YoYFormState,
  MathFormState,
  LeadLagFormState
} from '../charts/LineChart/types/DataManipulationTypes';

const DataManipulationModal: React.FC<DataManipulationModalProps> = ({
  isOpen,
  onClose,
  onApply,
  processedSeries,
  seriesNames
}) => {
  // Form state for each operation type
  const [yoyForm, setYoyForm] = useState<YoYFormState>({
    seriesId: '',
    frequency: 'year',
    calculationType: 'percentage'
  });

  const [mathForm, setMathForm] = useState<MathFormState>({
    primarySeriesId: '',
    operation: 'add',
    secondarySeriesId: ''
  });

  const [leadLagForm, setLeadLagForm] = useState<LeadLagFormState>({
    seriesId: '',
    direction: 'lead',
    periods: 1,
    unit: 'months'
  });

  // Add formula form state
  const [formulaForm, setFormulaForm] = useState({
    formula: '',
    resultName: ''
  });

  const [activeOperation, setActiveOperation] = useState<'yoy' | 'leadlag' | 'formula' | null>(null);

  // Add state for tracking expanded sections
  const [expandedSections, setExpandedSections] = useState<{
    yoy: boolean;
    leadlag: boolean;
    formula: boolean;
  }>({
    yoy: false,
    leadlag: false,
    formula: false
  });

  // Function to handle section selection and expansion
  const handleSectionSelect = (section: 'yoy' | 'leadlag' | 'formula') => {
    // Set the active operation (radio button)
    setActiveOperation(section);
    
    // Open the selected section and close others
    setExpandedSections({
      yoy: section === 'yoy',
      leadlag: section === 'leadlag',
      formula: section === 'formula'
    });
  };

  // Function to handle arrow toggle (can close sections)
  const handleArrowToggle = (section: 'yoy' | 'leadlag' | 'formula') => {
    if (expandedSections[section]) {
      // If section is open, close it and deselect
      setExpandedSections({
        yoy: false,
        leadlag: false,
        formula: false
      });
      setActiveOperation(null);
    } else {
      // If section is closed, open it and select it
      handleSectionSelect(section);
    }
  };

  // Function to insert series name into formula
  const insertSeriesIntoFormula = (seriesName: string) => {
    const insertion = `[${seriesName}]`;
    setFormulaForm(prev => ({
      ...prev,
      formula: prev.formula + insertion
    }));
  };

  // Reset forms when modal opens
  useEffect(() => {
    if (isOpen) {
      setYoyForm({
        seriesId: processedSeries[0]?.id || '',
        frequency: 'year',
        calculationType: 'percentage'
      });
      setLeadLagForm({
        seriesId: processedSeries[0]?.id || '',
        direction: 'lead',
        periods: 1,
        unit: 'months'
      });
      setFormulaForm({
        formula: '',
        resultName: ''
      });
      setActiveOperation(null);
    }
  }, [isOpen, processedSeries]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (!activeOperation) return;

    let formData: ManipulationFormData;

    switch (activeOperation) {
      case 'yoy':
        formData = {
          operationType: 'yoy',
          parameters: {
            seriesId: yoyForm.seriesId,
            frequency: yoyForm.frequency,
            calculationType: yoyForm.calculationType
          }
        };
        break;
      case 'leadlag':
        formData = {
          operationType: 'leadlag',
          parameters: {
            seriesId: leadLagForm.seriesId,
            direction: leadLagForm.direction,
            periods: leadLagForm.periods,
            unit: leadLagForm.unit
          }
        };
        break;
      case 'formula':
        formData = {
          operationType: 'formula',
          parameters: {
            expression: formulaForm.formula,
            variables: [] // Will be populated later when we add formula parsing
          }
        };
        break;
      default:
        return;
    }

    onApply(formData);
    onClose();
  };

  const isFormValid = activeOperation !== null;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-container manipulation-modal">
        <div className="modal-header">
          <h2>Data Manipulation</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          {/* Year-over-Year Operations */}
          <div className="manipulation-section">
            <div className="section-header" onClick={() => handleSectionSelect('yoy')}>
              <label className="section-radio">
                <input
                  type="radio"
                  name="operation"
                  checked={activeOperation === 'yoy'}
                  onChange={() => handleSectionSelect('yoy')}
                  onClick={(e) => e.stopPropagation()}
                />
                <span>Year-over-Year Operations</span>
              </label>
              <button 
                type="button" 
                className="section-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  handleArrowToggle('yoy');
                }}
              >
                {expandedSections.yoy ? '▼' : '▶'}
              </button>
            </div>
            
            {expandedSections.yoy && (
              <div className={`section-content ${activeOperation === 'yoy' ? 'active' : ''}`}>
                <div className="input-group">
                  <label>Series</label>
                  <select
                    value={yoyForm.seriesId}
                    onChange={(e) => setYoyForm({ ...yoyForm, seriesId: e.target.value })}
                    className="settings-input"
                    disabled={activeOperation !== 'yoy'}
                  >
                    <option value="">Select series...</option>
                    {processedSeries.map(series => (
                      <option key={series.id} value={series.id}>
                        {seriesNames[series.dataKey] || series.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label>Frequency</label>
                  <select
                    value={yoyForm.frequency}
                    onChange={(e) => setYoyForm({ ...yoyForm, frequency: e.target.value as any })}
                    className="settings-input"
                    disabled={activeOperation !== 'yoy'}
                  >
                    <option value="year">Year-over-Year</option>
                    <option value="quarter">Quarter-over-Quarter</option>
                    <option value="month">Month-over-Month</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Calculation Type</label>
                  <select
                    value={yoyForm.calculationType}
                    onChange={(e) => setYoyForm({ ...yoyForm, calculationType: e.target.value as any })}
                    className="settings-input"
                    disabled={activeOperation !== 'yoy'}
                  >
                    <option value="percentage">Percentage Change</option>
                    <option value="basisPoints">Basis Point Change</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Lead/Lag Operations */}
          <div className="manipulation-section">
            <div className="section-header" onClick={() => handleSectionSelect('leadlag')}>
              <label className="section-radio">
                <input
                  type="radio"
                  name="operation"
                  checked={activeOperation === 'leadlag'}
                  onChange={() => handleSectionSelect('leadlag')}
                  onClick={(e) => e.stopPropagation()}
                />
                <span>Lead/Lag Operations</span>
              </label>
              <button 
                type="button" 
                className="section-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  handleArrowToggle('leadlag');
                }}
              >
                {expandedSections.leadlag ? '▼' : '▶'}
              </button>
            </div>
            
            {expandedSections.leadlag && (
              <div className={`section-content ${activeOperation === 'leadlag' ? 'active' : ''}`}>
                <div className="input-group">
                  <label>Series</label>
                  <select
                    value={leadLagForm.seriesId}
                    onChange={(e) => setLeadLagForm({ ...leadLagForm, seriesId: e.target.value })}
                    className="settings-input"
                    disabled={activeOperation !== 'leadlag'}
                  >
                    <option value="">Select series...</option>
                    {processedSeries.map(series => (
                      <option key={series.id} value={series.id}>
                        {seriesNames[series.dataKey] || series.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label>Direction</label>
                  <select
                    value={leadLagForm.direction}
                    onChange={(e) => setLeadLagForm({ ...leadLagForm, direction: e.target.value as any })}
                    className="settings-input"
                    disabled={activeOperation !== 'leadlag'}
                  >
                    <option value="lead">Lead (shift forward)</option>
                    <option value="lag">Lag (shift backward)</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Periods</label>
                  <div className="period-input-group">
                    <input
                      type="number"
                      min="1"
                      value={leadLagForm.periods}
                      onChange={(e) => setLeadLagForm({ ...leadLagForm, periods: parseInt(e.target.value) || 1 })}
                      className="settings-input period-number"
                      disabled={activeOperation !== 'leadlag'}
                    />
                    <select
                      value={leadLagForm.unit}
                      onChange={(e) => setLeadLagForm({ ...leadLagForm, unit: e.target.value as any })}
                      className="settings-input period-unit"
                      disabled={activeOperation !== 'leadlag'}
                    >
                      <option value="weeks">weeks</option>
                      <option value="months">months</option>
                      <option value="years">years</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Formula Operations */}
          <div className="manipulation-section">
            <div className="section-header" onClick={() => handleSectionSelect('formula')}>
              <label className="section-radio">
                <input
                  type="radio"
                  name="operation"
                  checked={activeOperation === 'formula'}
                  onChange={() => handleSectionSelect('formula')}
                  onClick={(e) => e.stopPropagation()}
                />
                <span>Formula Operations</span>
              </label>
              <button 
                type="button" 
                className="section-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  handleArrowToggle('formula');
                }}
              >
                {expandedSections.formula ? '▼' : '▶'}
              </button>
            </div>
            
            {expandedSections.formula && (
              <div className={`section-content ${activeOperation === 'formula' ? 'active' : ''}`}>
                <div className="input-group">
                  <label>Formula</label>
                  <textarea
                    value={formulaForm.formula}
                    onChange={(e) => setFormulaForm({ ...formulaForm, formula: e.target.value })}
                    className="settings-input formula-input"
                    placeholder="Enter formula (e.g., [SPX Index] + [AAPL] / [MSFT] * 100)"
                    rows={3}
                    disabled={activeOperation !== 'formula'}
                  />
                  <div className="formula-help">
                    Use [SeriesName] for series, +, -, *, /, () for operations
                  </div>
                </div>

                <div className="input-group">
                  <label>Available Series</label>
                  <div className="series-buttons">
                    {processedSeries.map(series => (
                      <button
                        key={series.id}
                        type="button"
                        className="series-insert-btn"
                        onClick={() => insertSeriesIntoFormula(seriesNames[series.dataKey] || series.name)}
                        disabled={activeOperation !== 'formula'}
                      >
                        {seriesNames[series.dataKey] || series.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label>Result Name</label>
                  <input
                    type="text"
                    value={formulaForm.resultName}
                    onChange={(e) => setFormulaForm({ ...formulaForm, resultName: e.target.value })}
                    className="settings-input"
                    placeholder="Custom result name (optional)"
                    disabled={activeOperation !== 'formula'}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button 
            className="btn-primary" 
            onClick={handleApply}
            disabled={!isFormValid}
          >
            Apply
          </button>
        </div>
      </div>
    </>
  );
};

export default DataManipulationModal; 