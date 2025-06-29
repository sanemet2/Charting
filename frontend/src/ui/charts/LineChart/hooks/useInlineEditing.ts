import { useState, useRef, useEffect } from 'react';

interface UseInlineEditingProps {
  initialTitle?: string;
}

interface UseInlineEditingReturn {
  chartTitle: string;
  setChartTitle: React.Dispatch<React.SetStateAction<string>>;
  isEditingTitle: boolean;
  setIsEditingTitle: React.Dispatch<React.SetStateAction<boolean>>;
  titleInputRef: React.RefObject<HTMLInputElement | null>;
  handleTitleSubmit: (e: React.FormEvent) => void;
}

export const useInlineEditing = ({
  initialTitle = 'Line Chart'
}: UseInlineEditingProps): UseInlineEditingReturn => {
  
  const [chartTitle, setChartTitle] = useState(initialTitle);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Focus and select title input when editing
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingTitle(false);
  };

  return {
    chartTitle,
    setChartTitle,
    isEditingTitle,
    setIsEditingTitle,
    titleInputRef,
    handleTitleSubmit
  };
}; 