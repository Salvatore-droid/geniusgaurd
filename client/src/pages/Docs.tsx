import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, Copy, Check } from 'lucide-react';

export default function Docs() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      subsections: [
        { title: 'Installation', content: 'Install the GeniusGuard browser extension from the Chrome Web Store or Firefox Add-ons.' },
        { title: 'API Key Setup', content: 'Generate your API key from the dashboard settings and use it in API requests.' },
      ],
    },
    {
      id: 'api-reference',
      title: 'API Reference',
      subsections: [
        { title: 'Authentication', content: 'All API requests require Bearer token authentication.' },
        { title: 'Rate Limits', content: 'API calls are limited to 1000 requests per hour per API key.' },
      ],
    },
    {
      id: 'extension',
      title: 'Browser Extension',
      subsections: [
        { title: 'Installation', content: 'Download from official stores or sideload for development.' },
        { title: 'Configuration', content: 'Configure extension settings in the popup menu.' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b border-border bg-card/30 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">GG</span>
            </div>
            <span className="font-display font-bold text-xl text-foreground">GeniusGuard</span>
          </a>
          <a href="/signin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign In</a>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="md:col-span-1">
            <div className="sticky top-24 space-y-2">
              <h3 className="font-display font-bold text-foreground mb-4">Documentation</h3>
              {sections.map((section) => (
                <div key={section.id}>
                  <a href={`#${section.id}`} className="block px-4 py-2 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors">
                    {section.title}
                  </a>
                  <div className="ml-4 space-y-1">
                    {section.subsections.map((sub, idx) => (
                      <a key={idx} href={`#${section.id}-${idx}`} className="block px-4 py-1 rounded text-xs text-muted-foreground hover:text-foreground transition-colors">
                        {sub.title}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <main className="md:col-span-3 space-y-12">
            {/* Hero */}
            <div>
              <h1 className="font-display text-5xl font-bold text-foreground mb-4">Documentation</h1>
              <p className="text-lg text-muted-foreground">Learn how to integrate GeniusGuard into your security workflow.</p>
            </div>

            {/* Quick Links */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-6 bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 transition-colors cursor-pointer">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  Getting Started <ChevronRight size={18} />
                </h3>
                <p className="text-sm text-muted-foreground">Set up GeniusGuard and run your first scan in minutes.</p>
              </Card>
              <Card className="p-6 bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 transition-colors cursor-pointer">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  API Reference <ChevronRight size={18} />
                </h3>
                <p className="text-sm text-muted-foreground">Complete API documentation for developers.</p>
              </Card>
            </div>

            {/* Sections */}
            {sections.map((section) => (
              <div key={section.id} id={section.id} className="scroll-mt-20">
                <h2 className="font-display text-3xl font-bold text-foreground mb-6">{section.title}</h2>
                <div className="space-y-6">
                  {section.subsections.map((subsection, idx) => (
                    <Card key={idx} id={`${section.id}-${idx}`} className="p-6 bg-card/50 backdrop-blur-sm border-border">
                      <h3 className="font-semibold text-foreground mb-3">{subsection.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{subsection.content}</p>

                      {/* Code Example */}
                      {idx === 0 && section.id === 'api-reference' && (
                        <div className="mt-4">
                          <p className="text-xs font-semibold text-foreground mb-2">Example Request:</p>
                          <div className="relative bg-muted/50 rounded-lg p-4 border border-border">
                            <pre className="text-xs text-muted-foreground overflow-x-auto">
{`curl -X POST https://api.geniusguard.io/v1/scan \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com",
    "scan_type": "quick"
  }'`}
                            </pre>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => copyToClipboard('curl -X POST https://api.geniusguard.io/v1/scan', 'api-example')}
                            >
                              {copied === 'api-example' ? <Check size={16} /> : <Copy size={16} />}
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ))}

            {/* Extension Guide */}
            <div className="border-t border-border pt-12">
              <h2 className="font-display text-3xl font-bold text-foreground mb-6">Browser Extension Guide</h2>
              <div className="space-y-6">
                <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
                  <h3 className="font-semibold text-foreground mb-3">Installation</h3>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>1. Visit the Chrome Web Store or Firefox Add-ons page</p>
                    <p>2. Search for "GeniusGuard" and click "Add to Chrome" or "Add to Firefox"</p>
                    <p>3. Grant the required permissions when prompted</p>
                    <p>4. Sign in with your GeniusGuard account</p>
                  </div>
                </Card>

                <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
                  <h3 className="font-semibold text-foreground mb-3">Deep Scan Workflow</h3>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>1. Click the GeniusGuard extension icon in your browser toolbar</p>
                    <p>2. Select "Start Deep Scan" to begin recording your session</p>
                    <p>3. Navigate through your application as you normally would</p>
                    <p>4. Click "Stop Recording" when finished</p>
                    <p>5. The extension automatically uploads the session data for analysis</p>
                    <p>6. View detailed vulnerability findings in your dashboard</p>
                  </div>
                </Card>
              </div>
            </div>

            {/* Support */}
            <div className="border-t border-border pt-12">
              <h2 className="font-display text-3xl font-bold text-foreground mb-6">Need Help?</h2>
              <Card className="p-8 bg-card/50 backdrop-blur-sm border-border text-center">
                <p className="text-muted-foreground mb-6">Can't find what you're looking for? Our support team is here to help.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button variant="outline">Contact Support</Button>
                  <Button>View Community Forum</Button>
                </div>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
