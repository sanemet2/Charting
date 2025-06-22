# 📊 Chart Library

A professional, interactive chart library built with React, TypeScript, and Recharts. Features drag-and-drop functionality, real-time data visualization, and a comprehensive suite of chart types for financial data analysis.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

## ✨ Features

### 📈 **Chart Types**
- **Line Charts**: Clean time series visualization with performance optimizations
- **Bar Charts**: Responsive bar charts with customizable styling
- **Scatter Plots**: True scatter analysis with meaningful X-Y relationships
- **Pie Charts**: Dynamic pie charts with latest value representation

### 🎯 **Drag & Drop Interface**
- Drag data series from the Data Browser directly onto charts
- Visual feedback during drag operations
- Smart drop zones with highlighting
- Automatic data integration

### 📊 **Data Browser**
- **File Tree Structure**: Navigate through Excel-like file → tab → series hierarchy
- **Search Functionality**: Real-time search with 500ms debouncing for performance
- **Metadata Tooltips**: Hover to see series details (frequency, date range, source, etc.)
- **Collapsible Navigation**: Expandable folders for organized data browsing

### 🎨 **Customization**
- **Chart Settings**: Comprehensive settings modal for each chart type
- **Grid Layouts**: Multiple grid sizes (2x2, 3x3, 4x4, 5x5)
- **Responsive Design**: Adapts to different screen sizes
- **Library Management**: Create and manage multiple chart libraries

### ⚡ **Performance Optimizations**
- **Smart Animations**: Auto-disable animations when >3 charts for better performance
- **React.memo**: Prevents unnecessary re-renders
- **Data Sampling**: Intelligent sampling reduces visual density (every 5th-30th point)
- **Debounced Search**: Optimized search with reduced API calls

### 💾 **Mock Data**
- **Realistic Financial Data**: Bloomberg-style equity, rates, FX, and economic indicators
- **Time Series**: Multi-year daily data with proper trends and volatility
- **Multiple Frequencies**: Daily, weekly, monthly, quarterly, yearly data support

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/sanemet2/Charting.git
cd Charting
```

2. **Install dependencies:**
```bash
cd frontend
npm install
```

3. **Start the development server:**
```bash
npm start
```

4. **Open your browser:**
Navigate to `http://localhost:3000`

## 📖 Usage

### Creating Your First Chart

1. **Create a Library**: Click the "+" button in the sidebar to create a new chart library
2. **Add Charts**: Use the "+ New Chart" button to add Line, Bar, Scatter, or Pie charts
3. **Browse Data**: Hover over the right edge to open the Data Browser
4. **Drag & Drop**: Drag any data series from the file tree onto your charts
5. **Customize**: Click the ⚙️ button on any chart to open settings

### Chart Types Guide

#### 📈 Line Charts
- Perfect for time series data
- Shows trends over time
- Multiple series support with color coding

#### 📊 Bar Charts
- Great for comparing discrete values
- Sampled data for better performance
- Responsive bar sizing

#### ⚡ Scatter Plots
- **Single Series**: Plots Value vs Daily Returns (volatility analysis)
- **Multiple Series**: Shows correlation between different data series
- True scatter analysis, not time series with dots

#### 🥧 Pie Charts
- Uses latest values from each series
- Automatic color assignment
- Interactive legend

### Data Browser Features

- **Search**: Type to search across all data series
- **File Tree**: Navigate organized data structure
- **Metadata**: Hover for detailed series information
- **Expandable**: Click arrows to expand/collapse folders

## 🏗️ Project Structure

```
Chart Library/
├── frontend/                 # React TypeScript application
│   ├── src/
│   │   ├── api/             # API layer (future use)
│   │   │   ├── models/      # TypeScript interfaces and types
│   │   │   ├── services/    # Data services and mock data
│   │   │   └── utils/       # Utility functions
│   │   ├── state/           # State management (future use)
│   │   └── ui/              # UI components
│   │       ├── charts/      # Chart components (Line, Bar, Scatter, Pie)
│   │       ├── components/  # Reusable UI components
│   │       └── containers/  # Container components (future use)
│   ├── public/              # Static assets
│   └── package.json         # Dependencies and scripts
├── chart-library-specifications.md  # Detailed specifications
├── frontend-design.md       # Design documentation
└── README.md               # This file
```

## 🔧 Technical Stack

- **Frontend**: React 18 with TypeScript
- **Charts**: Recharts library
- **Styling**: CSS3 with responsive design
- **State Management**: React hooks and context
- **Build Tool**: Create React App
- **Performance**: React.memo, useMemo, useCallback optimizations

## 📊 Performance Features

### Smart Animation Management
- Animations automatically disabled when >3 charts
- Maintains smooth UX while ensuring performance

### Data Sampling
- **Line Charts**: Every 5th point (~360 points from 1,800)
- **Bar Charts**: Every 20th point (~90 bars)
- **Scatter Charts**: Every 30th point (~60 points)

### Memory Optimization
- React.memo on all chart components
- Memoized data processing
- Debounced search (500ms)

## 🎨 Customization

### Chart Settings
Each chart type supports:
- Grid visibility toggle
- Legend show/hide
- Tooltip customization
- Animation control
- Color customization
- Axis labeling

### Grid Layouts
- **2x2**: Large charts, detailed view
- **3x3**: Balanced layout
- **4x4**: Compact overview
- **5x5**: Maximum density

## 🚧 Future Enhancements

- [ ] Real data source integration
- [ ] Export functionality (PNG, PDF, Excel)
- [ ] Advanced chart annotations
- [ ] Interactive axis adjustment with drag handles
- [ ] Chart templates and presets
- [ ] Collaborative features
- [ ] Advanced filtering and data transformation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Recharts** for the excellent charting library
- **React** team for the amazing framework
- **TypeScript** for type safety and developer experience

---

**Built with ❤️ for data visualization and financial analysis** 