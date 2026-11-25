export function matchesBook(book, term="", category="") {
  const query=String(term).trim().toLocaleLowerCase();
  const categoryMatch=!category||String(book.category_id||book.category)===String(category);
  const textMatch=!query||`${book.title} ${book.author} ${book.description} ${book.category}`.toLocaleLowerCase().includes(query);
  return categoryMatch&&textMatch;
}
