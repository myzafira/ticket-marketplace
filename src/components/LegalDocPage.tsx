import type { LegalDoc } from "@/lib/legal/content";

export default function LegalDocPage({ doc }: { doc: LegalDoc }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">{doc.title}</h1>
      <p className="mt-1 text-sm text-gray-400">{doc.updated}</p>
      <p className="mt-4 text-gray-700">{doc.intro}</p>

      <div className="mt-8 space-y-8">
        {doc.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">
              {section.heading}
            </h2>
            <div className="space-y-3">
              {section.body.map((paragraph, i) => (
                <p key={i} className="text-gray-700">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
