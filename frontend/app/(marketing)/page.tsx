import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { AnimatedSection } from '@/components/site/animated-section';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Section } from '@/components/site/section';
import { industries, landingFeatures, pricingPlans, testimonials } from '@/lib/site';

export default function LandingPage() {
  return (
    <main className="text-slate-50">
      <Section className="pt-6">
        <AnimatedSection>
          <div className="glass flex items-center justify-between rounded-full px-5 py-3 text-sm">
            <span className="font-medium">SmartQueue AI</span>
            <Button href="/login" variant="ghost" className="text-emerald-300">
              Login
            </Button>
          </div>
        </AnimatedSection>
      </Section>

      <Section className="py-10 lg:py-16">
        <AnimatedSection>
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">
                Premium queue management for modern service organizations
              </p>
              <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight text-white md:text-7xl">
                Queues that feel effortless, intelligent, and beautifully branded.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                SmartQueue AI blends QR entry, live queue tracking, staff operations, AI wait prediction, and polished
                display screens into one enterprise-grade SaaS experience.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button href="/register">Start free trial <ArrowRight className="ml-2 h-4 w-4" /></Button>
                <Button href="#pricing" variant="secondary">Book demo</Button>
              </div>
            </div>
            <Card className="shadow-[0_20px_120px_rgba(34,197,94,0.18)]">
              <p className="text-sm text-slate-400">Live queue summary</p>
              <div className="mt-4 space-y-4">
                {[
                  ['Current Token', 'A-014'],
                  ['Your Token', 'A-021'],
                  ['People Ahead', '4'],
                  ['Estimated Wait', '12 min']
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                    <span className="text-slate-400">{label}</span>
                    <span className="font-medium text-white">{value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </AnimatedSection>
      </Section>

      <Section>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {landingFeatures.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title}>
                <Icon className="h-10 w-10 text-emerald-300" />
                <h2 className="mt-5 text-xl font-semibold">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">{item.text}</p>
              </Card>
            );
          })}
        </div>
      </Section>

      <Section>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="text-2xl font-semibold">How it works</h2>
            <div className="mt-6 space-y-4 text-sm text-slate-300">
              {['Generate a branded QR code for each service counter.', 'Customers join from mobile with name and number.', 'Staff call, transfer, complete, or skip tokens from one dashboard.', 'Everyone sees live updates on the customer screen.'].map((step, index) => (
                <div key={step} className="flex gap-4 rounded-2xl bg-white/5 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">{index + 1}</div>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h2 className="text-2xl font-semibold">Industries</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {industries.map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-8 grid gap-3 text-sm text-slate-300">
              {['AI wait-time prediction', 'Business-hour aware routing', 'Priority and VIP queue rules', 'Offline recovery and audit logs'].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  {item}
                </span>
              ))}
            </div>
          </Card>
        </div>
      </Section>

      <Section>
        <div className="grid gap-6 lg:grid-cols-3">
          {testimonials.map((item) => (
            <Card key={item.name}>
              <p className="text-base leading-7 text-slate-200">&ldquo;{item.quote}&rdquo;</p>
              <div className="mt-6">
                <p className="font-medium text-white">{item.name}</p>
                <p className="text-sm text-slate-400">{item.role}</p>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="pricing">
        <div className="grid gap-6 lg:grid-cols-4">
          {pricingPlans.map((plan) => (
            <Card key={plan.name} className={plan.name === 'Professional' ? 'border-emerald-400/40 bg-emerald-400/8' : ''}>
              <p className="text-sm text-slate-400">{plan.name}</p>
              <p className="mt-3 text-4xl font-semibold">{plan.price}</p>
              <p className="mt-3 text-sm text-slate-300">{plan.description}</p>
              <div className="mt-6 space-y-2 text-sm text-slate-200">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    {feature}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </Section>
    </main>
  );
}
