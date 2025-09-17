# ApexWeather

ApexWeather is a web application that provides real-time weather updates for major motorsport series events. Stay informed about track conditions for Formula 1, WRC, NASCAR, and MotoGP races.

## Features

- **Multiple Motorsport Series**: Track weather for Formula 1, World Rally Championship, NASCAR, and MotoGP.
- **Real-time Weather Updates**: Temperature, rain chance, wind speed, air pressure, humidity.
- **Comprehensive Track Details**: Complete track information including length, number of turns, elevation change, direction, and lap records for all tracks across all series.
- **Mobile-friendly UI**: Sticky headers, larger tap targets, and a minimize panel toggle.

## Technologies Used

- **Next.js** - React framework with server-side rendering capabilities
- **TypeScript** - For type safety and better developer experience
- **Tailwind CSS** - For responsive and utility-first styling
- **Weather API** - For fetching real-time weather data (coming soon)

## Local Development

### Prerequisites

- Node.js 18.0.0 or newer
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/apexweather.git
   cd apexweather
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Deployment

The application is designed to be easily deployed on any static site hosting platform:

1. Build the production version:
   ```bash
   npm run build
   # or
   yarn build
   ```

2. The output files will be in the `.next` directory, ready to be deployed.

## Project Structure

```
apexweather/
├── app/                  # Next.js App Router
│   ├── components/       # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript type definitions
│   ├── lib/              # Utilities and helper functions
│   ├── api/              # API routes
│   ├── series/           # Series-specific pages
│   └── page.tsx          # Homepage
├── public/               # Static assets
└── README.md             # Project documentation
```

## Future Enhancements

- Integration with a professional weather API
- User accounts to save favorite series and receive notifications
- Historical weather data for past races
- Additional motorsport series

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Weather data provided by [OpenWeatherMap](https://openweathermap.org/) (planned integration)
- Racing schedule data compiled from various public sources

---

Visit the live site at [apexweather.live](https://apexweather.live)
