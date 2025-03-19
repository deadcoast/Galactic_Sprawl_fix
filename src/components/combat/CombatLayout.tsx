import * as React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

/**
 * Layout component for combat-related pages
 * Provides navigation and common structure for all combat views
 */
export const CombatLayout: React.FC = () => {
  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-gray-700 bg-gray-800 p-4">
        <h1 className="text-2xl font-bold text-white">Combat Operations</h1>
        <nav className="mt-2">
          <ul className="flex space-x-4">
            <li>
              <NavLink
                to="/combat"
                end
                className={({ isActive }) =>
                  `inline-block rounded px-3 py-2 ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`
                }
              >
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/combat/formations"
                className={({ isActive }) =>
                  `inline-block rounded px-3 py-2 ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`
                }
              >
                Formations
              </NavLink>
            </li>
          </ul>
        </nav>
      </header>
      <main className="flex-1 overflow-auto p-4">
        <Outlet />
      </main>
    </div>
  );
};

export default CombatLayout;
