import { CombatSystemDemo } from '../components/combat/CombatSystemDemo';

/**
 * CombatSystemPage
 *
 * A page that showcases the Combat System UI components.
 */
export default function CombatSystemPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-white">Combat System</h1>
        <p className="text-gray-300">
          Advanced detection, tracking, and alert system for monitoring space objects and threats.
        </p>
      </header>

      <div className="mb-8">
        <CombatSystemDemo />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg bg-gray-800 p-6">
          <h2 className="mb-4 text-xl font-bold text-white">System Features</h2>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-start">
              <span className="mt-1 mr-2 inline-block h-4 w-4 rounded-full bg-green-500"></span>
              <span>Real-time object detection and tracking</span>
            </li>
            <li className="flex items-start">
              <span className="mt-1 mr-2 inline-block h-4 w-4 rounded-full bg-green-500"></span>
              <span>Customizable detection ranges and visualization</span>
            </li>
            <li className="flex items-start">
              <span className="mt-1 mr-2 inline-block h-4 w-4 rounded-full bg-green-500"></span>
              <span>Threat assessment and classification</span>
            </li>
            <li className="flex items-start">
              <span className="mt-1 mr-2 inline-block h-4 w-4 rounded-full bg-green-500"></span>
              <span>Multi-level alert system with priority handling</span>
            </li>
            <li className="flex items-start">
              <span className="mt-1 mr-2 inline-block h-4 w-4 rounded-full bg-green-500"></span>
              <span>Performance-optimized rendering for various device capabilities</span>
            </li>
          </ul>
        </div>

        <div className="rounded-lg bg-gray-800 p-6">
          <h2 className="mb-4 text-xl font-bold text-white">Usage Instructions</h2>
          <div className="space-y-4 text-gray-300">
            <p>
              <strong className="text-white">Object Selection:</strong> Click on unknown object in
              the radar to select it and view detailed information.
            </p>
            <p>
              <strong className="text-white">Range Management:</strong> Click on range rings to
              activate different detection modes.
            </p>
            <p>
              <strong className="text-white">Alert Handling:</strong> Acknowledge or dismiss alerts
              as they appear. Critical alerts require immediate attention.
            </p>
            <p>
              <strong className="text-white">Performance Settings:</strong> Adjust visual quality
              based on your device capabilities using the quality toggle.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-lg bg-gray-800 p-6">
        <h2 className="mb-4 text-xl font-bold text-white">Technical Specifications</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-lg font-semibold text-white">Detection System</h3>
            <ul className="space-y-1 text-gray-300">
              <li>• Maximum detection range: 10 light years</li>
              <li>• Object classification accuracy: 94%</li>
              <li>• Scan refresh rate: 2.5 seconds</li>
              <li>• Simultaneous object tracking: Up to 200</li>
            </ul>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold text-white">Alert System</h3>
            <ul className="space-y-1 text-gray-300">
              <li>• Alert priority levels: 4</li>
              <li>• Alert processing latency: &lt;50ms</li>
              <li>• Automated threat assessment</li>
              <li>• Integration with ship-wide systems</li>
            </ul>
          </div>
        </div>
      </div>

      <footer className="text-center text-sm text-gray-500">
        <p>Combat System v1.0 - Galactic Sprawl Project</p>
      </footer>
    </div>
  );
}
