// Import ReportHandler type from web-vitals for performance reporting
import { ReportHandler } from 'web-vitals';

// Define reportWebVitals function for performance measurement configuration
const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  // Check if onPerfEntry exists and is a valid function
  if (onPerfEntry && onPerfEntry instanceof Function) {
    // Import web-vitals functions dynamically for performance metrics
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      // Call getCLS function to measure Cumulative Layout Shift
      getCLS(onPerfEntry);
      // Call getFID function to measure First Input Delay
      getFID(onPerfEntry);
      // Call getFCP function to measure First Contentful Paint
      getFCP(onPerfEntry);
      // Call getLCP function to measure Largest Contentful Paint
      getLCP(onPerfEntry);
      // Call getTTFB function to measure Time to First Byte
      getTTFB(onPerfEntry);
    });
  }
};

// Export reportWebVitals function as default module export
export default reportWebVitals;
