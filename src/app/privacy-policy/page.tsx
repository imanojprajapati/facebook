'use client';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Information We Collect</h2>
          <p className="text-gray-600 mb-4">
            We collect information from your Facebook account when you authorize our application, including:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Your name and email address</li>
            <li>Pages you manage</li>
            <li>Lead information from your Facebook Pages</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">How We Use Your Information</h2>
          <p className="text-gray-600 mb-4">
            We use the collected information to:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Display your Facebook Pages and associated leads</li>
            <li>Provide page management functionality</li>
            <li>Improve our application&apos;s performance and user experience</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Data Storage and Security</h2>
          <p className="text-gray-600 mb-4">
            We implement security measures to protect your information:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Data encryption in transit and at rest</li>
            <li>Secure authentication using NextAuth.js</li>
            <li>Regular security audits and updates</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Rights</h2>
          <p className="text-gray-600 mb-4">
            You have the right to:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Access your personal data</li>
            <li>Request deletion of your data</li>
            <li>Revoke Facebook permissions</li>
            <li>Request data portability</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
          <p className="text-gray-600">
            If you have any questions about this Privacy Policy, please contact us at:
            <a href="mailto:privacy@leadstrack.in" className="text-facebook hover:text-facebook-hover ml-1">
              privacy@leadstrack.in
            </a>
          </p>
        </section>

        <footer className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </footer>
      </div>
    </div>
  );
}
