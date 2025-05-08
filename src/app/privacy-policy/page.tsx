// pages/privacy-policy.tsx

import Head from 'next/head';

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy | Your Brand Name</title>
        <meta name="description" content="Read our privacy policy to understand how we handle your data." />
      </Head>
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        <p className="mb-4">
          At Your Brand Name, we value your privacy. This Privacy Policy outlines how we collect, use, and protect your personal information.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">1. Information We Collect</h2>
        <p className="mb-4">
          We may collect personal details like your name, email address, phone number, and any other data you provide through our forms.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">2. How We Use Your Information</h2>
        <p className="mb-4">
          The information we collect is used to provide services, respond to inquiries, and improve our offerings.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">3. Sharing of Information</h2>
        <p className="mb-4">
          We do not sell or share your personal information with third parties except to comply with the law or protect our rights.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">4. Security</h2>
        <p className="mb-4">
          We implement industry-standard security measures to protect your data.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">5. Changes</h2>
        <p className="mb-4">
          We may update this policy periodically. Please check this page regularly for any changes.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">6. Contact Us</h2>
        <p>
          If you have any questions, please contact us at <a href="mailto:support@yourbrand.com" className="text-blue-600 underline">support@yourbrand.com</a>.
        </p>
      </main>
    </>
  );
}
