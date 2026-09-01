import NewHeader from '@/components/figma-landing/NewHeader';
import NewFooter from '@/components/figma-landing/NewFooter';

const POSTS = [
  {
    date: 'August 2026',
    title: 'Price tracking is here',
    body: 'Tap Track on any saved product and we will check its price once a day -- you will see the trend right on the product page, no spreadsheet required.',
  },
  {
    date: 'August 2026',
    title: 'Chat that can actually do things',
    body: 'Ask the AI assistant to add something to your cart, favorite it, or drop it into a list, and it just does it -- no more copy-pasting recommendations back into the app yourself.',
  },
  {
    date: 'August 2026',
    title: 'Voice input in chat',
    body: 'Tap the mic in chat and talk instead of type, on both the app and the website.',
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white">
      <NewHeader />

      <main className="container mx-auto px-4 sm:px-8 lg:px-20 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold text-ink mb-3">Blog</h1>
        <p className="text-lg text-[#78716C] mb-10">
          Product updates and the occasional deep dive.
        </p>

        <div id="whats-new" className="space-y-8 scroll-mt-24">
          {POSTS.map((post) => (
            <article key={post.title} className="border-t border-[#E7E5E4] pt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand mb-1">
                {post.date}
              </p>
              <h2 className="text-lg font-semibold text-ink mb-2">{post.title}</h2>
              <p className="text-[#78716C]">{post.body}</p>
            </article>
          ))}
        </div>
      </main>

      <NewFooter />
    </div>
  );
}
