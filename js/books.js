import { getSupabase, isSupabaseConfigured } from "./supabase-client.js";
export const demoCategories = ["Mathematics","English","Science","Computer Science","Information Technology","History","General Knowledge","Literature","Islamic Studies","Other Educational Books"];
export const demoBooks = [
 {id:"demo-1",title:"A Gentle Introduction to Mathematics",author:"kareemi_writes editorial",category:"Mathematics",description:"A friendly starting point for core mathematical ideas, from patterns and numbers to clear problem-solving habits.",featured:true,created_at:"2026-06-12",allow_download:false,published:true,coverTone:"cover-sage"},
 {id:"demo-2",title:"The Art of Clear English",author:"kareemi_writes editorial",category:"English",description:"Build confidence with reading, writing, vocabulary, and the small details that make communication clear.",featured:true,created_at:"2026-05-28",allow_download:false,published:true,coverTone:"cover-gold"},
 {id:"demo-3",title:"Curiosity in the Natural World",author:"kareemi_writes editorial",category:"Science",description:"Explore the questions, observations, and experiments that help us understand the world around us.",featured:true,created_at:"2026-05-14",allow_download:false,published:true,coverTone:"cover-blue"},
 {id:"demo-4",title:"Thinking with Computers",author:"kareemi_writes editorial",category:"Computer Science",description:"An approachable introduction to computational thinking, algorithms, and the logic behind digital tools.",featured:true,created_at:"2026-04-30",allow_download:false,published:true,coverTone:"cover-blush"},
 {id:"demo-5",title:"Stories That Shaped History",author:"kareemi_writes editorial",category:"History",description:"A starting point for exploring the people, choices, and ideas that shaped our shared past.",featured:false,created_at:"2026-04-11",allow_download:false,published:true,coverTone:"cover-gold"},
 {id:"demo-6",title:"A Field Guide to Everyday Science",author:"kareemi_writes editorial",category:"Science",description:"Everyday observations become a doorway to scientific thinking, evidence, and discovery.",featured:false,created_at:"2026-03-24",allow_download:false,published:true,coverTone:"cover-sage"},
 {id:"demo-7",title:"Reading for Meaning",author:"kareemi_writes editorial",category:"Literature",description:"Practical approaches for noticing detail, interpreting a text, and enjoying a closer read.",featured:false,created_at:"2026-03-03",allow_download:false,published:true,coverTone:"cover-blush"},
 {id:"demo-8",title:"Digital Skills for Learners",author:"kareemi_writes editorial",category:"Information Technology",description:"A guide to useful digital habits, online research, and thoughtful technology use.",featured:false,created_at:"2026-02-17",allow_download:false,published:true,coverTone:"cover-blue"}
];
let cache;
export function escapeHtml(value=""){return String(value).replace(/[&<>"']/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[character]));}
export async function loadLibrary(){
 if(!isSupabaseConfigured){return {books:demoBooks,categories:demoCategories.map(name=>({id:name,name})),demo:true,error:null};}
 try{
  const supabase=await getSupabase();
  const [{data:books,error:bookError},{data:categories,error:categoryError}]=await Promise.all([
   supabase.from("books").select("id,title,author,category_id,description,cover_image_path,pdf_file_path,featured,published,allow_download,created_at,categories(id,name)").eq("published",true).order("created_at",{ascending:false}),
   supabase.from("categories").select("id,name,description").order("name")
  ]);
  if(bookError)throw bookError;if(categoryError)throw categoryError;
  const normalized=(books||[]).map(book=>({...book,category:book.categories?.name||"Uncategorized",cover_image_url:book.cover_image_path?supabase.storage.from("book-covers").getPublicUrl(book.cover_image_path).data.publicUrl:null,coverTone:"cover-sage"}));
  cache={books:normalized,categories:categories||[],demo:false,error:null};return cache;
 }catch(error){return {books:[],categories:[],demo:false,error:error?.message||"Library data could not be loaded."};}
}
export function bookCard(book){
 const title=escapeHtml(book.title),category=escapeHtml(book.category),author=escapeHtml(book.author);
 const cover=book.cover_image_url?`<img src="${escapeHtml(book.cover_image_url)}" alt="Cover of ${title}" loading="lazy">`:`<div class="cover-placeholder ${escapeHtml(book.coverTone||"cover-sage")}"><span class="cover-ornament">✳</span><strong>${title}</strong><small>${category}</small></div>`;
 return `<article class="book-card"><a href="book-details.html?id=${encodeURIComponent(book.id)}" aria-label="View ${title}"><div class="book-cover">${cover}</div></a><div class="book-info"><div class="book-meta">${category}</div><h3><a href="book-details.html?id=${encodeURIComponent(book.id)}">${title}</a></h3><p class="book-author">by ${author}</p><div class="book-card-footer"><a href="book-details.html?id=${encodeURIComponent(book.id)}">View details <span aria-hidden="true">↗</span></a><span>${book.allow_download?"Read & download":"Read online"}</span></div></div></article>`;
}
export async function getBookById(id){const result=await loadLibrary();return result.books.find(book=>book.id===id)||null;}
export async function getProtectedPdfUrl(book){
 if(!book.pdf_file_path)return null;
 if(!isSupabaseConfigured)return book.pdf_file_path;
 const supabase=await getSupabase();const {data,error}=await supabase.storage.from("book-pdfs").createSignedUrl(book.pdf_file_path,90);
 if(error)throw error;return data.signedUrl;
}
