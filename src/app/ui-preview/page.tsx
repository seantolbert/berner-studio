import Button from "@/app/components/ui/Button";
import Card from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";

export const dynamic = "force-static";

export default function UIPreviewPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-10">
      <header>
        <h1 className="text-3xl font-semibold text-ink">UI Preview</h1>
        <p className="text-sm text-ink/70">Lean Tailwind components with wood-themed tokens.</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-ink">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-ink">Badges</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Neutral</Badge>
          <Badge tone="maple">Maple</Badge>
          <Badge tone="oak">Oak</Badge>
          <Badge tone="walnut">Walnut</Badge>
          <Badge tone="accent">Accent</Badge>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-ink">Card</h2>
        <Card>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-ink">Walnut Serving Board</h3>
              <p className="text-sm text-ink/70">Rich walnut grain with chamfered edge.</p>
            </div>
            <Badge tone="walnut">Walnut</Badge>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button>Shop</Button>
            <Button variant="ghost">Details</Button>
          </div>
        </Card>
      </section>

      <footer className="pt-8 text-xs text-ink/60">
        Token-driven components preview.
      </footer>
    </div>
  );
}
