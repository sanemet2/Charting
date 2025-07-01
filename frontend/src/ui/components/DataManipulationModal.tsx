import React, { useState, useEffect } from 'react';
import './DataManipulationModal.css';
import {
  DataManipulationModalProps,
  ManipulationFormData,
  YoYFormState,
  MathFormState,
  LeadLagFormState,
  FormulaFormState,
  YearOverYearParams,
  MathematicalParams,
  LeadLagParams,
  FormulaParams
} from '../charts/LineChart/types/DataManipulationTypes';
import { validateFormula, getExampleFormulas } from '../charts/LineChart/utils';

const DataManipulationModal: React.FC<DataManipulationModalProps> = ({
  isOpen,
  onClose,
  onApply,
  processedSeries,
  seriesNames
}) => {
  // Form state for each section
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
    unit: 'weeks'
  });

  const [formulaForm, setFormulaForm] = useState<FormulaFormState>({
    expression: '',
    isValid: false,
    errorMessage: undefined,
    detectedVariables: []
  });

  // Expandable section state
  const [expandedSections, setExpandedSections] = useState({
    yoy: false,
    math: false,
    leadlag: false
  });

  // Reset forms when modal opens
  useEffect(() => {
    if (isOpen) {
      const firstSeriesId = processedSeries.length > 0 ? processedSeries[0].dataKey : '';
      const secondSeriesId = processedSeries.length > 1 ? processedSeries[1].dataKey : '';
      
      setYoyForm({
        seriesId: firstSeriesId,
        frequency: 'year',
        calculationType: 'percentage'
      });

      setMathForm({
        primarySeriesId: firstSeriesId,
        operation: 'add',
        secondarySeriesId: secondSeriesId
      });

      setLeadLagForm({
        seriesId: firstSeriesId,
        direction: 'lead',
        periods: 1,
        unit: 'weeks'
      });

      setFormulaForm({
        expression: '',
        isValid: false,
        errorMessage: undefined,
        detectedVariables: []
      });
    }
  }, [isOpen, processedSeries]);

  if (!isOpen) return null;

  const handleYoYApply = () => {
    if (!yoyForm.seriesId) return;

    const formData: ManipulationFormData = {
      operationType: 'yoy',
      parameters: yoyForm as YearOverYearParams
    };

    console.log('YoY Apply clicked with:', formData);
    onApply(formData);
    onClose();
  };

  const handleMathApply = () => {
    if (!mathForm.primarySeriesId || !mathForm.secondarySeriesId) return;

    const formData: ManipulationFormData = {
      operationType: 'math',
      parameters: mathForm as MathematicalParams
    };

    console.log('Math Apply clicked with:', formData);
    onApply(formData);
    onClose();
  };

  const handleLeadLagApply = () => {
    if (!leadLagForm.seriesId) return;

    const formData: ManipulationFormData = {
      operationType: 'leadlag',
      parameters: leadLagForm as LeadLagParams
    };

    console.log('Lead/Lag Apply clicked with:', formData);
    onApply(formData);
    onClose();
  };

  const toggleSection = (section: 'yoy' | 'math' | 'leadlag') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle formula validation
  const handleFormulaChange = (expression: string) => {
    const availableVariables = processedSeries.map(s => s.dataKey);
    const validation = validateFormula(expression, availableVariables);
    
    setFormulaForm({
      expression,
      isValid: validation.isValid,
      errorMessage: validation.errorMessage,
      detectedVariables: validation.detectedVariables
    });
  };

  const handleFormulaApply = () => {
    if (!formulaForm.isValid) return;

    const formData: ManipulationFormData = {
      operationType: 'formula',
      parameters: {
        expression: formulaForm.expression,
        variables: formulaForm.detectedVariables
      } as FormulaParams
    };

    console.log('Formula Apply clicked with:', formData);
    onApply(formData);
    onClose();
  };

  const isYoYValid = yoyForm.seriesId !== '';
  const isMathValid = mathForm.primarySeriesId !== '' && mathForm.secondarySeriesId !== '' && mathForm.primarySeriesId !== mathForm.secondarySeriesId;
  const isLeadLagValid = leadLagForm.seriesId !== '' && leadLagForm.periods > 0;
  const isFormulaValid = formulaForm.isValid;

  return (
    <>
      <div className="manipulation-modal-backdrop" onClick={onClose} />
      <div className="manipulation-modal-container">
        <div className="manipulation-modal-header">
          <h2>Data Manipulation</h2>
          <button className="manipulation-modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="manipulation-modal-body">
          
          {/* Year-over-Year Operations Section */}
          <div className="operation-section">
            <div 
              className="operation-section-header"
              onClick={() => toggleSection('yoy')}
            >
              <h3>Year-over-Year Operations</h3>
              <span className={`section-chevron ${expandedSections.yoy ? 'expanded' : ''}`}>
                ▼
              </span>
            </div>
            
            <div className={`operation-section-content ${expandedSections.yoy ? 'expanded' : ''}`}>
              <div className="operation-section-inner">
                <div className="form-group">
                  <label>Series</label>
                  <select
                    className="form-select"
                    value={yoyForm.seriesId}
                    onChange={(e) => setYoyForm({ ...yoyForm, seriesId: e.target.value })}
                  >
                    <option value="">Select a series...</option>
                    {processedSeries.map((series) => (
                      <option key={series.dataKey} value={series.dataKey}>
                        {seriesNames[series.dataKey] || series.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Frequency</label>
                  <select
                    className="form-select"
                    value={yoyForm.frequency}
                    onChange={(e) => setYoyForm({ ...yoyForm, frequency: e.target.value as YoYFormState['frequency'] })}
                  >
                    <option value="year">Year-over-Year</option>
                    <option value="quarter">Quarter-over-Quarter</option>
                    <option value="month">Month-over-Month</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Calculation Type</label>
                  <select
                    className="form-select"
                    value={yoyForm.calculationType}
                    onChange={(e) => setYoyForm({ ...yoyForm, calculationType: e.target.value as YoYFormState['calculationType'] })}
                  >
                    <option value="percentage">Percentage Change</option>
                    <option value="basisPoints">Basis Point Change</option>
                  </select>
                </div>

                <div style={{ paddingTop: '16px' }}>
                  <button 
                    className="btn-manipulation-primary"
                    onClick={handleYoYApply}
                    disabled={!isYoYValid}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mathematical Operations Section */}
          <div className="operation-section">
            <div 
              className="operation-section-header"
              onClick={() => toggleSection('math')}
            >
              <h3>Mathematical Operations</h3>
              <span className={`section-chevron ${expandedSections.math ? 'expanded' : ''}`}>
                ▼
              </span>
            </div>
            
            <div className={`operation-section-content ${expandedSections.math ? 'expanded' : ''}`}>
              <div className="operation-section-inner">
                <div className="form-group">
                  <label>Primary Series</label>
                  <select
                    className="form-select"
                    value={mathForm.primarySeriesId}
                    onChange={(e) => setMathForm({ ...mathForm, primarySeriesId: e.target.value })}
                  >
                    <option value="">Select primary series...</option>
                    {processedSeries.map((series) => (
                      <option key={series.dataKey} value={series.dataKey}>
                        {seriesNames[series.dataKey] || series.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Operation</label>
                  <select
                    className="form-select"
                    value={mathForm.operation}
                    onChange={(e) => setMathForm({ ...mathForm, operation: e.target.value as MathFormState['operation'] })}
                  >
                    <option value="add">Add (+)</option>
                    <option value="subtract">Subtract (-)</option>
                    <option value="multiply">Multiply (×)</option>
                    <option value="divide">Divide (÷)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Secondary Series</label>
                  <select
                    className="form-select"
                    value={mathForm.secondarySeriesId}
                    onChange={(e) => setMathForm({ ...mathForm, secondarySeriesId: e.target.value })}
                  >
                    <option value="">Select secondary series...</option>
                    {processedSeries
                      .filter(series => series.dataKey !== mathForm.primarySeriesId)
                      .map((series) => (
                      <option key={series.dataKey} value={series.dataKey}>
                        {seriesNames[series.dataKey] || series.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ paddingTop: '16px' }}>
                  <button 
                    className="btn-manipulation-primary"
                    onClick={handleMathApply}
                    disabled={!isMathValid}
                  >
                    Apply
                  </button>
                </div>

                {/* Advanced Formula Subsection */}
                <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '600', color: '#4b5563' }}>
                    Advanced Formula
                  </h4>
                  
                  <div className="form-group">
                    <label>Formula Expression</label>
                    <textarea
                      className={`formula-input ${formulaForm.isValid ? 'valid' : formulaForm.errorMessage ? 'error' : ''}`}
                      value={formulaForm.expression}
                      onChange={(e) => handleFormulaChange(e.target.value)}
                      placeholder="Enter formula (e.g., (SPX + DJI) / VIX * 100)"
                    />
                    
                    {formulaForm.expression && (
                      <div className={`formula-validation ${formulaForm.isValid ? 'valid' : 'error'}`}>
                        <span className="formula-validation-icon">
                          {formulaForm.isValid ? '✓' : '✗'}
                        </span>
                        {formulaForm.isValid ? 'Valid formula' : formulaForm.errorMessage}
                      </div>
                    )}
                  </div>

                  <div className="available-variables">
                    <label>Available Series:</label>
                    <div className="variables-list">
                      {processedSeries.map((series) => (
                        <span key={series.dataKey} className="variable-chip">
                          {series.dataKey}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ paddingTop: '16px', paddingBottom: '16px' }}>
                    <button 
                      className="btn-manipulation-primary"
                      onClick={handleFormulaApply}
                      disabled={!isFormulaValid}
                    >
                      Apply
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Lead/Lag Operations Section */}
          <div className="operation-section">
            <div 
              className="operation-section-header"
              onClick={() => toggleSection('leadlag')}
            >
              <h3>Lead/Lag Operations</h3>
              <span className={`section-chevron ${expandedSections.leadlag ? 'expanded' : ''}`}>
                ▼
              </span>
            </div>
            
            <div className={`operation-section-content ${expandedSections.leadlag ? 'expanded' : ''}`}>
              <div className="operation-section-inner">
                <div className="form-group">
                  <label>Series</label>
                  <select
                    className="form-select"
                    value={leadLagForm.seriesId}
                    onChange={(e) => setLeadLagForm({ ...leadLagForm, seriesId: e.target.value })}
                  >
                    <option value="">Select a series...</option>
                    {processedSeries.map((series) => (
                      <option key={series.dataKey} value={series.dataKey}>
                        {seriesNames[series.dataKey] || series.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Direction</label>
                  <div className="radio-group">
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="direction"
                        value="lead"
                        checked={leadLagForm.direction === 'lead'}
                        onChange={(e) => setLeadLagForm({ ...leadLagForm, direction: e.target.value as LeadLagFormState['direction'] })}
                      />
                      Lead (shift forward)
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="direction"
                        value="lag"
                        checked={leadLagForm.direction === 'lag'}
                        onChange={(e) => setLeadLagForm({ ...leadLagForm, direction: e.target.value as LeadLagFormState['direction'] })}
                      />
                      Lag (shift backward)
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Periods</label>
                  <div className="number-with-unit">
                    <input
                      type="number"
                      className="form-input"
                      value={leadLagForm.periods}
                      onChange={(e) => setLeadLagForm({ ...leadLagForm, periods: parseInt(e.target.value) || 1 })}
                      min="1"
                    />
                    <select
                      className="form-select"
                      value={leadLagForm.unit}
                      onChange={(e) => setLeadLagForm({ ...leadLagForm, unit: e.target.value as LeadLagFormState['unit'] })}
                      style={{ maxWidth: '120px' }}
                    >
                      <option value="weeks">weeks</option>
                      <option value="months">months</option>
                      <option value="years">years</option>
                    </select>
                  </div>
                </div>

                <div style={{ paddingTop: '16px' }}>
                  <button 
                    className="btn-manipulation-primary"
                    onClick={handleLeadLagApply}
                    disabled={!isLeadLagValid}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>



        </div>

        <div className="manipulation-modal-footer">
          <button className="btn-manipulation-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </>
  );
};

export default DataManipulationModal; 