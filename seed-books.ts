export type SeedBookRow = {
  title: string;
  author: string;
  isbn: string;
  total_copies: number;
  genre: string;
  publication_year: number;
  author_nationality: string;
  kids_friendly: 0 | 1;
};

export const EXTRA_BOOKS: SeedBookRow[] = [
  { title: 'Charlotte’s Web', author: 'E.B. White', isbn: '9780064400558', total_copies: 4, genre: 'Children', publication_year: 1952, author_nationality: 'American', kids_friendly: 1 },
  { title: 'Matilda', author: 'Roald Dahl', isbn: '9780142410373', total_copies: 5, genre: 'Children', publication_year: 1988, author_nationality: 'British', kids_friendly: 1 },
  { title: 'The Hobbit', author: 'J.R.R. Tolkien', isbn: '9780547928227', total_copies: 6, genre: 'Fantasy', publication_year: 1937, author_nationality: 'British', kids_friendly: 1 },
  { title: 'Harry Potter and the Philosopher’s Stone', author: 'J.K. Rowling', isbn: '9780747532699', total_copies: 8, genre: 'Fantasy', publication_year: 1997, author_nationality: 'British', kids_friendly: 1 },
  { title: 'The Lion, the Witch and the Wardrobe', author: 'C.S. Lewis', isbn: '9780064471046', total_copies: 5, genre: 'Fantasy', publication_year: 1950, author_nationality: 'British', kids_friendly: 1 },
  { title: 'Anne of Green Gables', author: 'L.M. Montgomery', isbn: '9780141321112', total_copies: 3, genre: 'Fiction', publication_year: 1908, author_nationality: 'Canadian', kids_friendly: 1 },
  { title: 'Little Women', author: 'Louisa May Alcott', isbn: '9780141439514', total_copies: 4, genre: 'Fiction', publication_year: 1868, author_nationality: 'American', kids_friendly: 1 },
  { title: 'The Catcher in the Rye', author: 'J.D. Salinger', isbn: '9780316769488', total_copies: 5, genre: 'Fiction', publication_year: 1951, author_nationality: 'American', kids_friendly: 0 },
  { title: 'Brave New World', author: 'Aldous Huxley', isbn: '9780060850524', total_copies: 4, genre: 'Science Fiction', publication_year: 1932, author_nationality: 'British', kids_friendly: 0 },
  { title: 'Dune', author: 'Frank Herbert', isbn: '9780441172719', total_copies: 5, genre: 'Science Fiction', publication_year: 1965, author_nationality: 'American', kids_friendly: 0 },
  { title: 'Foundation', author: 'Isaac Asimov', isbn: '9780553293357', total_copies: 4, genre: 'Science Fiction', publication_year: 1951, author_nationality: 'American', kids_friendly: 0 },
  { title: 'Jane Eyre', author: 'Charlotte Brontë', isbn: '9780141441146', total_copies: 3, genre: 'Romance', publication_year: 1847, author_nationality: 'British', kids_friendly: 0 },
  { title: 'Wuthering Heights', author: 'Emily Brontë', isbn: '9781853260018', total_copies: 3, genre: 'Romance', publication_year: 1847, author_nationality: 'British', kids_friendly: 0 },
  { title: 'The Road', author: 'Cormac McCarthy', isbn: '9780307387899', total_copies: 3, genre: 'Fiction', publication_year: 2006, author_nationality: 'American', kids_friendly: 0 },
  { title: 'Sapiens', author: 'Yuval Noah Harari', isbn: '9780062316110', total_copies: 5, genre: 'Nonfiction', publication_year: 2011, author_nationality: 'Israeli', kids_friendly: 0 },
  { title: 'Educated', author: 'Tara Westover', isbn: '9780399590504', total_copies: 4, genre: 'Nonfiction', publication_year: 2018, author_nationality: 'American', kids_friendly: 0 },
  { title: 'The Body Keeps the Score', author: 'Bessel van der Kolk', isbn: '9780143127741', total_copies: 3, genre: 'Nonfiction', publication_year: 2014, author_nationality: 'Dutch', kids_friendly: 0 },
  { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', isbn: '9780374533557', total_copies: 3, genre: 'Nonfiction', publication_year: 2011, author_nationality: 'Israeli-American', kids_friendly: 0 },
  { title: 'The Silent Patient', author: 'Alex Michaelides', isbn: '9781250301697', total_copies: 4, genre: 'Mystery', publication_year: 2019, author_nationality: 'Cypriot', kids_friendly: 0 },
  { title: 'Gone Girl', author: 'Gillian Flynn', isbn: '9780307588371', total_copies: 4, genre: 'Mystery', publication_year: 2012, author_nationality: 'American', kids_friendly: 0 },
  { title: 'The Girl with the Dragon Tattoo', author: 'Stieg Larsson', isbn: '9780307949486', total_copies: 3, genre: 'Mystery', publication_year: 2005, author_nationality: 'Swedish', kids_friendly: 0 },
  { title: 'Where the Wild Things Are', author: 'Maurice Sendak', isbn: '9780060254926', total_copies: 5, genre: 'Children', publication_year: 1963, author_nationality: 'American', kids_friendly: 1 },
  { title: 'The Gruffalo', author: 'Julia Donaldson', isbn: '9780333901762', total_copies: 5, genre: 'Children', publication_year: 1999, author_nationality: 'British', kids_friendly: 1 },
  { title: 'Goodnight Moon', author: 'Margaret Wise Brown', isbn: '9780064430173', total_copies: 6, genre: 'Children', publication_year: 1947, author_nationality: 'American', kids_friendly: 1 },
  { title: 'The Very Hungry Caterpillar', author: 'Eric Carle', isbn: '9780399226908', total_copies: 7, genre: 'Children', publication_year: 1969, author_nationality: 'American', kids_friendly: 1 },
  { title: 'Percy Jackson: The Lightning Thief', author: 'Rick Riordan', isbn: '9780786838653', total_copies: 6, genre: 'Fantasy', publication_year: 2005, author_nationality: 'American', kids_friendly: 1 },
  { title: 'The Hunger Games', author: 'Suzanne Collins', isbn: '9780439023481', total_copies: 7, genre: 'Science Fiction', publication_year: 2008, author_nationality: 'American', kids_friendly: 1 },
  { title: 'The Handmaid’s Tale', author: 'Margaret Atwood', isbn: '9780385490818', total_copies: 4, genre: 'Science Fiction', publication_year: 1985, author_nationality: 'Canadian', kids_friendly: 0 },
  { title: 'Crime and Punishment', author: 'Fyodor Dostoevsky', isbn: '9780486415871', total_copies: 3, genre: 'Fiction', publication_year: 1866, author_nationality: 'Russian', kids_friendly: 0 },
  { title: 'Anna Karenina', author: 'Leo Tolstoy', isbn: '9780143035008', total_copies: 3, genre: 'Fiction', publication_year: 1877, author_nationality: 'Russian', kids_friendly: 0 },
  { title: 'The Brothers Karamazov', author: 'Fyodor Dostoevsky', isbn: '9780374528379', total_copies: 2, genre: 'Fiction', publication_year: 1880, author_nationality: 'Russian', kids_friendly: 0 },
  { title: 'Beloved', author: 'Toni Morrison', isbn: '9781400033416', total_copies: 3, genre: 'Fiction', publication_year: 1987, author_nationality: 'American', kids_friendly: 0 },
  { title: 'The Color Purple', author: 'Alice Walker', isbn: '9780156031820', total_copies: 3, genre: 'Fiction', publication_year: 1982, author_nationality: 'American', kids_friendly: 0 },
  { title: 'Life of Pi', author: 'Yann Martel', isbn: '9780156027328', total_copies: 4, genre: 'Fiction', publication_year: 2001, author_nationality: 'Canadian', kids_friendly: 0 },
  { title: 'The Kite Runner', author: 'Khaled Hosseini', isbn: '9781594631934', total_copies: 4, genre: 'Fiction', publication_year: 2003, author_nationality: 'Afghan-American', kids_friendly: 0 },
  { title: 'A Brief History of Time', author: 'Stephen Hawking', isbn: '9780553380163', total_copies: 4, genre: 'Nonfiction', publication_year: 1988, author_nationality: 'British', kids_friendly: 0 },
  { title: 'Cosmos', author: 'Carl Sagan', isbn: '9780345539434', total_copies: 3, genre: 'Nonfiction', publication_year: 1980, author_nationality: 'American', kids_friendly: 0 },
  { title: 'The Immortal Life of Henrietta Lacks', author: 'Rebecca Skloot', isbn: '9781400052189', total_copies: 3, genre: 'Nonfiction', publication_year: 2010, author_nationality: 'American', kids_friendly: 0 },
  { title: 'Becoming', author: 'Michelle Obama', isbn: '9781524763138', total_copies: 5, genre: 'Nonfiction', publication_year: 2018, author_nationality: 'American', kids_friendly: 0 },
  { title: 'Outliers', author: 'Malcolm Gladwell', isbn: '9780316017930', total_copies: 4, genre: 'Nonfiction', publication_year: 2008, author_nationality: 'Canadian', kids_friendly: 0 },
  { title: 'The Midnight Library', author: 'Matt Haig', isbn: '9780525559474', total_copies: 4, genre: 'Fiction', publication_year: 2020, author_nationality: 'British', kids_friendly: 0 },
  { title: 'Circe', author: 'Madeline Miller', isbn: '9780316556347', total_copies: 3, genre: 'Fantasy', publication_year: 2018, author_nationality: 'American', kids_friendly: 0 },
  { title: 'The Song of Achilles', author: 'Madeline Miller', isbn: '9780062060624', total_copies: 3, genre: 'Fantasy', publication_year: 2011, author_nationality: 'American', kids_friendly: 0 },
  { title: 'Project Hail Mary', author: 'Andy Weir', isbn: '9780593135204', total_copies: 5, genre: 'Science Fiction', publication_year: 2021, author_nationality: 'American', kids_friendly: 0 },
  { title: 'The Martian', author: 'Andy Weir', isbn: '9780553418026', total_copies: 5, genre: 'Science Fiction', publication_year: 2011, author_nationality: 'American', kids_friendly: 0 },
  { title: 'Norwegian Wood', author: 'Haruki Murakami', isbn: '9780375704024', total_copies: 3, genre: 'Fiction', publication_year: 1987, author_nationality: 'Japanese', kids_friendly: 0 },
  { title: 'Kafka on the Shore', author: 'Haruki Murakami', isbn: '9781400079278', total_copies: 3, genre: 'Fiction', publication_year: 2002, author_nationality: 'Japanese', kids_friendly: 0 },
  { title: 'Attention Is All You Need', author: 'Vaswani et al.', isbn: '9781707916824', total_copies: 6, genre: 'Academic Paper', publication_year: 2017, author_nationality: 'Various', kids_friendly: 0 },
  { title: 'Deep Residual Learning for Image Recognition', author: 'He et al.', isbn: '9781707916831', total_copies: 5, genre: 'Academic Paper', publication_year: 2015, author_nationality: 'Chinese', kids_friendly: 0 },
  { title: 'Masters Thesis: Urban Planning and Climate', author: 'Samira Khan', isbn: '9781707916848', total_copies: 2, genre: 'Thesis', publication_year: 2023, author_nationality: 'British', kids_friendly: 0 },
  { title: 'PhD Dissertation: Quantum Error Correction', author: 'Jordan Lee', isbn: '9781707916855', total_copies: 2, genre: 'Dissertation', publication_year: 2022, author_nationality: 'American', kids_friendly: 0 },
  { title: 'IEEE Proceedings — Software Engineering Practices', author: 'IEEE', isbn: '9781707916862', total_copies: 8, genre: 'Conference Proceedings', publication_year: 2021, author_nationality: 'American', kids_friendly: 0 },
  { title: 'Nature — Special Issue on CRISPR', author: 'Nature Publishing', isbn: '9781707916879', total_copies: 4, genre: 'Academic Journal', publication_year: 2020, author_nationality: 'British', kids_friendly: 0 },
  { title: 'ACM Computing Surveys: Machine Learning', author: 'ACM', isbn: '9781707916886', total_copies: 5, genre: 'Survey Paper', publication_year: 2019, author_nationality: 'American', kids_friendly: 0 },
];
