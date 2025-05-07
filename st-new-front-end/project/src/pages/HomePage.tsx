import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, DollarSign, Building2, FileCheck, FileSpreadsheet, FileText } from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600/80 to-green-600/90  backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="text-center">
            <h1 className="text-3xl tracking-tight font-extrabold text-white sm:text-4xl md:text-5xl">
              Simply Track, Simplifies Capital Gains
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-base text-white sm:text-lg">
              Best & Cloud software for IRS Wash Sale analysis. Simply Track simplifies portfolio tracking, Wash Sales and IRS Schedule D generation.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <Link
                  to="/signup"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 md:py-4 md:text-lg md:px-10"
                >
                  Start free trial
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="container  relative  max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 ">
        <div className= "bg-gradient-to-r  from-indigo-100 to-10% shadow-2xl p-8">
            <h4 className="text-3xl text-center font-extrabold text-gray-900 sm:text-4xl">
            Simply Track
          </h4>
          <p className="from-neutral-600 backdrop-blur-sm text-gray-700 leading-relaxed py-4">
            With Simply Track you can import all your trades from various brokerage accounts and generate your IRS form-8949 for your Schedule D with a click of the mouse. Don't spend hours doing wash sale calculations for your capital gains tax forms, Simply Track will do it all for you. You can even export your Schedule D into .TXF format for importing into any tax software program that accepts TXF files such as TurboTax and TaxCut. Simply track can Import from your Brokerage's Servers or it can import from Excel or CSV files. Using Simply Track generic import feature you can pretty much import any format.
          </p>
        </div>
      </div>



      {/* Feature Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Wash Sale Card */}
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/20 rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mb-4">
                <FileCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Wash Sale Adjustment</h3>
              <p className="text-gray-700">
                Simply track checks for 30+ different wash sale scenarios and accurately detect wash sales. If you trade with multiple broker accounts, Simply track can detect wash sale between the broker accounts.
              </p>
            </div>
          </div>

          {/* Export Tax Card */}
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/20 rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-500 text-white mb-4">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Export Tax Information</h3>
              <p className="text-gray-700">
                Simply Track is compatible with the most popular tax preparation software packages.
              </p>
            </div>
          </div>

          {/* Schedule D Card */}
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/20 rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white mb-4">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Schedule D & Other Reports</h3>
              <p className="text-gray-700">
                With Simply Track investors can file their taxes easily and accurately. Simply Track generates IRS Form 8949 tax reporting, including all wash sale adjustments required by the IRS for taxpayers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Simple, transparent pricing
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Basic Plan */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Basic</h3>
            <p className="mt-2 text-sm text-gray-500">Perfect for getting started</p>
            <p className="mt-4">
              <span className="text-4xl font-extrabold text-gray-900">Free</span>
            </p>
            <ul className="mt-6 space-y-4">
              <li className="flex items-start">
                <span className="text-sm text-gray-500">Basic trade tracking</span>
              </li>
              <li className="flex items-start">
                <span className="text-sm text-gray-500">Simple reports</span>
              </li>
            </ul>
            <Link
              to="/signup"
              className="mt-8 block w-full bg-blue-500 text-white text-center px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Get started
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-gradient-to-br from-gray-50 to-purple-50 border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
              <DollarSign className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Pro</h3>
            <p className="mt-2 text-sm text-gray-500">For serious traders</p>
            <p className="mt-4">
              <span className="text-4xl font-extrabold text-gray-900">$29</span>
              <span className="text-sm text-gray-500">/month</span>
            </p>
            <ul className="mt-6 space-y-4">
              <li className="flex items-start">
                <span className="text-sm text-gray-500">Advanced trade tracking</span>
              </li>
              <li className="flex items-start">
                <span className="text-sm text-gray-500">Detailed reports</span>
              </li>
              <li className="flex items-start">
                <span className="text-sm text-gray-500">Wash sale detection</span>
              </li>
            </ul>
            <Link
              to="/signup"
              className="mt-8 block w-full bg-blue-500 text-white text-center px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Start Pro trial
            </Link>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-gradient-to-br from-gray-50 to-green-50 border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Enterprise</h3>
            <p className="mt-2 text-sm text-gray-500">Custom solutions for your business</p>
            <p className="mt-4">
              <span className="text-4xl font-extrabold text-gray-900">Custom</span>
            </p>
            <ul className="mt-6 space-y-4">
              <li className="flex items-start">
                <span className="text-sm text-gray-500">Custom integration</span>
              </li>
              <li className="flex items-start">
                <span className="text-sm text-gray-500">Dedicated support</span>
              </li>
              <li className="flex items-start">
                <span className="text-sm text-gray-500">Advanced features</span>
              </li>
            </ul>
            <Link
              to="/contact"
              className="mt-8 block w-full bg-blue-500 text-white text-center px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Contact us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;