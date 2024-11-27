# L2 Network Testing Suite

A Next.js application that provides a dashboard for monitoring, stress testing, and generating reports on data collected. It compares a provided Layer 2 (L2) network with Linea across various performance metrics.

## Features

- **Dashboard**: Real-time monitoring of various network metrics.
- **Stress Testing**: Simulate network load to assess performance under stress.
- **Report Generation**: Generate PDF reports based on collected data.
- **Comparative Analysis**: Compare performance metrics between a provided L2 network and Linea.

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/nadeemb53/l2-vs-linea-metrics.git
   cd l2-vs-linea-metrics
   ```

2. **Install Dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Run the Development Server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open the App**

   Navigate to [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Scripts

- `npm run dev` or `yarn dev`: Runs the app in development mode.
- `npm run build` or `yarn build`: Builds the app for production.
- `npm run start` or `yarn start`: Starts the production server.
- `npm run lint` or `yarn lint`: Runs ESLint for code linting.

## Project Structure

```
├── app
│   ├── api
│   │   ├── generate-pdf
│   │   │   └── route.ts         # API route for PDF generation
│   │   └── stress-test
│   │       └── route.ts         # API route for stress testing
│   ├── components
│   │   ├── Dashboard.tsx        # Main dashboard component
│   │   ├── MetricsCard.tsx      # Component for displaying metrics
│   │   ├── charts               # Chart components for various metrics
│   │   │   ├── BlockTimeChart.tsx
│   │   │   ├── GasChart.tsx
│   │   │   ├── NetworkLatencyChart.tsx
│   │   │   ├── NodeMetricsChart.tsx
│   │   │   ├── ProofTimeChart.tsx
│   │   │   ├── ReorgFrequencyChart.tsx
│   │   │   ├── SuccessRateChart.tsx
│   │   │   ├── TPSChart.tsx
│   │   │   └── index.ts
│   │   └── ui
│   │       └── card.tsx         # UI card component
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Layout component
│   ├── page.tsx                 # Home page
│   ├── reports
│   │   └── page.tsx             # Reports page
│   └── stress-test
│       ├── StressTestForm.tsx   # Form for initiating stress tests
│       ├── StressTestProgress.tsx
│       ├── StressTestResults.tsx
│       └── page.tsx             # Stress test page
├── lib                          # Utility libraries
│   ├── blockchain.ts            # Blockchain interaction functions
│   ├── metricsStorage.ts        # Metrics storage functions
│   ├── pdfUtils.ts              # PDF generation utilities
│   ├── stressTest.ts            # Stress test functions
│   └── utils.ts                 # General utilities
├── next-env.d.ts
├── next.config.js               # Next.js configuration
├── package.json
├── postcss.config.js
├── tailwind.config.js           # Tailwind CSS configuration
├── tsconfig.json
└── types
    └── index.ts                 # TypeScript type definitions
```

## Dependencies

- **Frameworks & Libraries**
  - [Next.js](https://nextjs.org/) 14.0.4
  - [React](https://reactjs.org/) 18.2.0
  - [TypeScript](https://www.typescriptlang.org/) 5.3.3
- **Styling**
  - [Tailwind CSS](https://tailwindcss.com/) 3.4.15
  - [clsx](https://github.com/lukeed/clsx) 2.0.0
- **Charts**
  - [Recharts](https://recharts.org/) 2.10.3
- **Blockchain Interaction**
  - [ethers.js](https://docs.ethers.io/v6/) 6.9.0
- **PDF Generation**
  - [jsPDF](https://github.com/parallax/jsPDF) 2.5.2
  - [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable) 3.8.4

## Usage

- **Dashboard**

  View real-time metrics and performance indicators on the dashboard.

- **Stress Testing**

  Navigate to the stress test page to simulate network load and assess performance.

- **Report Generation**

  Generate and download PDF reports from the reports section.

## License

This project is licensed under the [MIT License](LICENSE).
