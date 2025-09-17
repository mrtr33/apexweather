// Type definitions for leaflet-openweathermap
declare module 'leaflet-openweathermap' {
  // This module extends the L (Leaflet) global object
  // No exports, just extending Leaflet
}

// Extend the Leaflet namespace
declare namespace L {
  namespace OWM {
    function precipitation(options?: any): any;
    function precipitationClassic(options?: any): any;
    function rain(options?: any): any;
    function rainClassic(options?: any): any;
    function snow(options?: any): any;
    function pressure(options?: any): any;
    function pressureContour(options?: any): any;
    function temperature(options?: any): any;
    function wind(options?: any): any;
    function clouds(options?: any): any;
    function cloudsClassic(options?: any): any;
  }
} 