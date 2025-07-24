import { MessageCircle, Search, BarChart3, Calendar, Settings } from 'lucide-react'
import '../styles/Dashboard.css'

interface DashboardProps {
  onNavigateToChat: () => void
}

function Dashboard({ onNavigateToChat }: DashboardProps) {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-text">
          <h1>Snapchat Archive Dashboard</h1>
          <p>Demo viewer with sample chat history</p>
        </div>
      </div>
      
      <div className="dashboard-grid">
        <div className="dashboard-card primary" onClick={onNavigateToChat}>
          <div className="card-icon">
            <MessageCircle size={32} />
          </div>
          <h2>Interactive Chat Viewer</h2>
          <p>Browse conversations and explore the sample chat history</p>
          <div className="card-action">Open Viewer →</div>
        </div>
        
        <div className="dashboard-card disabled">
          <div className="card-icon">
            <Search size={32} />
          </div>
          <h2>Advanced Search</h2>
          <p>Search across all conversations with filters and date ranges</p>
          <div className="card-badge">Coming Soon</div>
        </div>
        
        <div className="dashboard-card disabled">
          <div className="card-icon">
            <BarChart3 size={32} />
          </div>
          <h2>Analytics & Insights</h2>
          <p>View statistics about your messaging patterns and activity</p>
          <div className="card-badge">Coming Soon</div>
        </div>
        
        <div className="dashboard-card disabled">
          <div className="card-icon">
            <Calendar size={32} />
          </div>
          <h2>Timeline Explorer</h2>
          <p>Visual timeline of your chat activity and milestones</p>
          <div className="card-badge">Coming Soon</div>
        </div>
        
        <div className="dashboard-card disabled">
          <div className="card-icon">
            <Settings size={32} />
          </div>
          <h2>Data Management</h2>
          <p>Export, backup, and manage your archive data</p>
          <div className="card-badge">Coming Soon</div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard