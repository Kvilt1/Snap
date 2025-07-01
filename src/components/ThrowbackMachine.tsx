import { useState, useMemo } from 'react'
import { ChatHistory } from '../types/snapchat'
import { Calendar } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import '../styles/ThrowbackMachine.css'

interface ThrowbackMachineProps {
  chatHistory: ChatHistory;
  onDateSelect: (date: Date | null) => void;
}

function ThrowbackMachine({ chatHistory, onDateSelect }: ThrowbackMachineProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Get date range from chat history
  const { minDate, maxDate } = useMemo(() => {
    let min: Date | null = null;
    let max: Date | null = null;

    Object.values(chatHistory).forEach(messages => {
      messages.forEach(msg => {
        const msgDate = parseISO(msg.Created.replace(' UTC', 'Z'));
        if (!min || msgDate < min) min = msgDate;
        if (!max || msgDate > max) max = msgDate;
      });
    });

    return {
      minDate: min ? format(min, 'yyyy-MM-dd') : '',
      maxDate: max ? format(max, 'yyyy-MM-dd') : ''
    };
  }, [chatHistory]);

  const handleDateChange = (dateStr: string) => {
    setSelectedDate(dateStr);
    if (dateStr) {
      const date = new Date(dateStr + 'T23:59:59');
      onDateSelect(date);
    } else {
      onDateSelect(null);
    }
  };

  const handleClear = () => {
    setSelectedDate('');
    onDateSelect(null);
    setIsOpen(false);
  };

  return (
    <div className="throwback-machine">
      <button
        className="throwback-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Throwback Machine"
      >
        <Calendar size={20} />
        {selectedDate && <span className="active-indicator" />}
      </button>
      
      {isOpen && (
        <div className="throwback-dropdown">
          <h4>Throwback Machine</h4>
          <p>Travel back to any date in your chat history</p>
          <input
            type="date"
            value={selectedDate}
            min={minDate}
            max={maxDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="date-input"
          />
          {selectedDate && (
            <div className="throwback-actions">
              <span className="selected-date">
                Viewing as of {format(new Date(selectedDate), 'MMMM d, yyyy')}
              </span>
              <button onClick={handleClear} className="clear-button">
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ThrowbackMachine;