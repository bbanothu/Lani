'use client';

export default function NewFooter() {
  const footerSections = [
    {
      title: 'Product',
      color: '#EA580C',
      links: [
        { text: 'How It Works', href: '/#how-it-works' },
        { text: 'Download Extension', href: '/extension-install-setup' },
        { text: 'Features', href: '/#features' },
        { text: 'Founding Shoppers Program', href: '/campaign' },
      ],
    },
    {
      title: 'Company',
      color: '#EA580C',
      links: [
        { text: 'About Us', href: '/about' },
        { text: 'Our Mission', href: '/about#mission' },
        { text: 'Careers', href: '/careers' },
        { text: 'Press Kit', href: '/press' },
        { text: 'Contact Us', href: '/support' },
      ],
    },
    {
      title: 'Resources',
      color: '#EA580C',
      links: [
        { text: 'Support & FAQ', href: '/support' },
        { text: 'Blog', href: '/blog' },
        { text: "What's New", href: '/blog#whats-new' },
      ],
    },
    {
      title: 'Legal',
      color: '#EA580C',
      links: [
        { text: 'Terms & Conditions', href: '/terms' },
        { text: 'Privacy Policy', href: '/privacy' },
        { text: 'Cookie Policy', href: '/cookies' },
        { text: 'Data & Security', href: '/security' },
      ],
    },
    {
      title: 'Connect',
      color: '#EA580C',
      links: [
        { text: 'Instagram', href: 'https://www.instagram.com/_shopwithlani/' },
        { text: 'TikTok', href: 'https://www.tiktok.com/@shopwithlani_' },
        { text: 'Twitter/X', href: 'https://x.com/shopwithlani' },
        { text: 'Newsletter', href: '/newsletter' },
      ],
    },
  ];

  return (
    <footer className="bg-white border-t border-[#E7E5E4] py-16">
      <div className="container mx-auto px-4 sm:px-8 lg:px-20">
        {/* Footer Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {footerSections.map((section, index) => (
            <div key={index}>
              <h3
                className="text-lg font-medium mb-4 -tracking-[0.44px]"
                style={{ color: section.color }}
              >
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className="text-base text-[#78716C] hover:text-[#F97316] transition -tracking-[0.31px] leading-6"
                      target={link.href.startsWith('http') ? '_blank' : undefined}
                      rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      {link.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="border-t border-[#E7E5E4] pt-8 text-center">
          <p className="text-base text-[#78716C] -tracking-[0.31px]">
            © 2025 Lani. Your personal shopping retriever. Built with ❤️
          </p>
        </div>
      </div>
    </footer>
  );
}
