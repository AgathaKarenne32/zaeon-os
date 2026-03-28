import { useState, useEffect } from "react";
import { PlusIcon, PhotoIcon, GlobeAmericasIcon, SparklesIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";
import NextImage from "next/image";

type Locale = "pt" | "en" | "zh" | "es" | "fr";

interface NewsPost {
    id: string; title: Record<Locale, string> | string; subtitle: Record<Locale, string> | string;
    content: Record<Locale, string> | string; imageUrl: string; publishDate: string;
    status: "published" | "draft"; category: "news" | "report"; 
}

export default function ReportsModule({ glassPanel }: { glassPanel: string }) {
    const [newsList, setNewsList] = useState<NewsPost[]>([]);
    const [currentLocale, setCurrentLocale] = useState<Locale>("pt");
    const [currentPost, setCurrentPost] = useState<NewsPost>({
        id: '', title: { pt: '', en: '', zh: '', es: '', fr: '' },
        subtitle: { pt: '', en: '', zh: '', es: '', fr: '' },
        content: { pt: '', en: '', zh: '', es: '', fr: '' },
        imageUrl: '', publishDate: new Date().toISOString().split('T')[0],
        status: 'draft', category: 'news' 
    });

    const fetchNews = async () => { const res = await fetch('/api/news'); if (res.ok) setNewsList(await res.json()); };
    useEffect(() => { fetchNews(); }, []);

    const handleSavePost = async () => {
        const payload = { ...currentPost };
        if (!payload.id) delete (payload as any).id;
        const res = await fetch('/api/news', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) { alert("📡 Neural Feed Sincronizado."); fetchNews(); }
    };

    const getPostTitle = (post: NewsPost, locale: Locale) => {
        if (!post.title) return "Untitled";
        if (typeof post.title === 'string') return post.title; 
        return post.title[locale] || post.title.pt || "Untitled";
    };

    return (
        <div className="flex-1 flex gap-8 overflow-hidden w-full h-full">
            <div className={`w-[320px] rounded-[45px] flex flex-col overflow-hidden ${glassPanel}`}>
                <div className="p-8 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
                    <h2 className="text-xl font-black text-slate-800 dark:text-white">Neural Feed</h2>
                    <button onClick={() => setCurrentPost({ id: '', title: { pt: '', en: '', zh: '', es: '', fr: '' }, subtitle: { pt: '', en: '', zh: '', es: '', fr: '' }, content: { pt: '', en: '', zh: '', es: '', fr: '' }, imageUrl: '', publishDate: new Date().toISOString().split('T')[0], status: 'draft', category: 'news' })} className="p-2 bg-slate-950 dark:bg-cyan-500 text-white dark:text-black rounded-full shadow-lg"><PlusIcon className="w-4 h-4" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {newsList.map((post) => (
                        <div key={post.id} onClick={() => setCurrentPost(post)} className={`p-5 rounded-3xl cursor-pointer transition-all border ${currentPost.id === post.id ? 'bg-cyan-500/10 border-cyan-500' : 'bg-transparent border-transparent hover:bg-white/40 dark:hover:bg-white/5'}`}>
                            <h4 className="font-bold text-sm text-slate-800 dark:text-white truncate">{getPostTitle(post, currentLocale)}</h4>
                            <p className="text-[9px] opacity-40 mt-1 uppercase font-black tracking-widest">{post.category} • {post.status}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className={`flex-1 rounded-[45px] flex flex-col relative overflow-hidden ${glassPanel}`}>
                <div className="absolute top-8 right-8 z-20 flex items-center gap-4">
                    <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10">
                        {(["pt", "en", "zh", "es"] as Locale[]).map((lang) => (
                            <button key={lang} onClick={() => setCurrentLocale(lang)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${currentLocale === lang ? 'bg-white dark:bg-cyan-500 text-black shadow-md' : 'text-slate-400'}`}>{lang.toUpperCase()}</button>
                        ))}
                    </div>
                    <button onClick={handleSavePost} className="px-8 py-3 rounded-2xl bg-slate-950 dark:bg-cyan-500 text-white dark:text-black font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3"><GlobeAmericasIcon className="w-5 h-5" /> Global Sync</button>
                </div>

                <div className="flex-1 overflow-y-auto p-12 pt-28 custom-scrollbar">
                    <div className="max-w-3xl mx-auto space-y-10">
                        <div className="w-full h-56 rounded-[35px] border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-black/20 group">
                            {currentPost.imageUrl ? (
                                <NextImage src={currentPost.imageUrl} alt="Post Header" fill className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                            ) : <><PhotoIcon className="w-10 h-10 text-slate-300 mb-2" /><span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Post Header Image</span></>}
                            <input type="text" placeholder="Paste Image URL..." className="absolute bottom-4 bg-white/90 dark:bg-black/70 px-4 py-2 rounded-xl text-[10px] w-2/3 outline-none border border-slate-200 dark:border-white/10" value={currentPost.imageUrl} onChange={(e) => setCurrentPost({...currentPost, imageUrl: e.target.value})} />
                        </div>

                        <div className="space-y-4">
                            <input type="text" placeholder="Post Title..." className="w-full bg-transparent text-5xl font-black outline-none border-none placeholder:text-slate-200 dark:placeholder:text-white/10" 
                                value={typeof currentPost.title === 'string' ? currentPost.title : currentPost.title[currentLocale]} 
                                onChange={(e) => {
                                    if (typeof currentPost.title === 'string') setCurrentPost({...currentPost, title: { pt: e.target.value, en: '', zh: '', es: '', fr: '' }});
                                    else setCurrentPost({...currentPost, title: {...currentPost.title, [currentLocale]: e.target.value}});
                                }} 
                            />
                            <input type="text" placeholder="Brief summary or subtitle..." className="w-full bg-transparent text-xl font-bold text-slate-400 outline-none border-none" 
                                value={typeof currentPost.subtitle === 'string' ? currentPost.subtitle : currentPost.subtitle[currentLocale]} 
                                onChange={(e) => {
                                    if (typeof currentPost.subtitle === 'string') setCurrentPost({...currentPost, subtitle: { pt: e.target.value, en: '', zh: '', es: '', fr: '' }});
                                    else setCurrentPost({...currentPost, subtitle: {...currentPost.subtitle, [currentLocale]: e.target.value}});
                                }} 
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-100 dark:border-white/5">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-2"><SparklesIcon className="w-3 h-3" /> Type of Post</label>
                                <select className="w-full bg-slate-100 dark:bg-white/5 p-3 rounded-xl outline-none text-[11px] font-bold uppercase tracking-widest appearance-none" value={currentPost.category} onChange={(e) => setCurrentPost({...currentPost, category: e.target.value as any})}>
                                    <option value="news">News / Update</option>
                                    <option value="report">Scientific Report</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-2"><CalendarDaysIcon className="w-3 h-3" /> Publish Date</label>
                                <input type="date" className="w-full bg-slate-100 dark:bg-white/5 p-3 rounded-xl outline-none text-[11px] font-bold" value={currentPost.publishDate} onChange={(e) => setCurrentPost({...currentPost, publishDate: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-2">Status</label>
                                <select className="w-full bg-slate-100 dark:bg-white/5 p-3 rounded-xl outline-none text-[11px] font-bold uppercase tracking-widest appearance-none" value={currentPost.status} onChange={(e) => setCurrentPost({...currentPost, status: e.target.value as any})}>
                                    <option value="draft">Draft (Private)</option>
                                    <option value="published">Published (Live)</option>
                                </select>
                            </div>
                        </div>

                        <textarea placeholder="Neural data entry..." className="w-full h-[600px] bg-transparent text-lg leading-relaxed outline-none border-none resize-none font-serif pt-6" 
                            value={typeof currentPost.content === 'string' ? currentPost.content : currentPost.content[currentLocale]} 
                            onChange={(e) => {
                                if (typeof currentPost.content === 'string') setCurrentPost({...currentPost, content: { pt: e.target.value, en: '', zh: '', es: '', fr: '' }});
                                else setCurrentPost({...currentPost, content: {...currentPost.content, [currentLocale]: e.target.value}});
                            }} 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}