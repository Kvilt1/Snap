import { useMemo, useState } from 'react'
import { ChatMessage } from '../types/snapchat'
import { format, parseISO } from 'date-fns'
import '../styles/TimelineSlider.css'

interface TimelineSliderProps {
  messages: ChatMessage[];
  onDateChange: (date: Date) => void;
}

function TimelineSlider({ messages, onDateChange }: TimelineSliderProps) {
  const [sliderValue, setSliderValue] = useState(100);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { minDate, maxDate, dateAtPosition } = useMemo(() => {
    if (messages.length === 0) return { minDate: new Date(), maxDate: new Date(), dateAtPosition: new Date() };
    
    const dates = messages.map(msg => parseISO(msg.Created.replace(' UTC', 'Z')));
    const min = new Date(Math.min(...dates.map(d => d.getTime())));
    const max = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Calculate date at current slider position
    const range = max.getTime() - min.getTime();
    const position = (sliderValue / 100) * range;
    const dateAt = new Date(min.getTime() + position);
    
    return { minDate: min, maxDate: max, dateAtPosition: dateAt };
  }, [messages, sliderValue]);

  const handleSliderChange = (value: number) => {
    setSliderValue(value);
    onDateChange(dateAtPosition);
  };

  const handleDatePick = (dateStr: string) => {
    const pickedDate = new Date(dateStr);
    const range = maxDate.getTime() - minDate.getTime();
    const position = ((pickedDate.getTime() - minDate.getTime()) / range) * 100;
    setSliderValue(Math.max(0, Math.min(100, position)));
    onDateChange(pickedDate);
    setShowDatePicker(false);
  };

  return (
    <div className="timeline-slider">
      <div className="timeline-info">
        <span className="timeline-date">{format(minDate, 'MMM d, yyyy')}</span>
        <span className="timeline-current" onClick={() => setShowDatePicker(!showDatePicker)}>
          {format(dateAtPosition, 'MMM d, yyyy')}
        </span>
        <span className="timeline-date">{format(maxDate, 'MMM d, yyyy')}</span>
      </div>
      
      <input
        type="range"
        min="0"
        max="100"
        value={sliderValue}
        onChange={(e) => handleSliderChange(Number(e.target.value))}
        className="slider"
      />
      
      {showDatePicker && (
        <div className="date-picker-popup">
          <input
            type="date"
            min={format(minDate, 'yyyy-MM-dd')}
            max={format(maxDate, 'yyyy-MM-dd')}
            onChange={(e) => handleDatePick(e.target.value)}
            autoFocus
          />
        </div>
      )}
    </div>
  );
}

export default TimelineSlider;