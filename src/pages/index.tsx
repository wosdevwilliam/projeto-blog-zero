import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import ptBR from 'date-fns/locale/pt-BR';
import { format } from 'date-fns';
import { BsPerson } from 'react-icons/bs';
import { AiOutlineCalendar } from 'react-icons/ai';

import { useState } from 'react';
import { IconContext } from 'react-icons/lib';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  async function handleLoadMore(): Promise<void> {
    if (postsPagination.next_page === null) {
      return;
    }
    const newPosts = await fetch(nextPage).then(response => response.json());

    setNextPage(newPosts.next_page);

    const morePosts: Post[] = newPosts.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });

    setPosts([...posts, ...morePosts]);
  }

  return (
    <>
      <IconContext.Provider value={{ style: { verticalAlign: 'middle' } }}>
        <Head>
          <title>Home | spacetraveling</title>
        </Head>
        <Header />
        <main className={commonStyles.container}>
          <div className={`${styles.posts} ${commonStyles.postsContainer}`}>
            {posts.map(post => (
              <Link href={`/post/${post?.uid}`}>
                <a key={post?.uid}>
                  <strong>{post?.data?.title}</strong>
                  <p>{post?.data?.subtitle}</p>
                  <AiOutlineCalendar size="1.0rem" />
                  <time>
                    {format(
                      new Date(post?.first_publication_date),
                      'dd MMM yyy',
                      {
                        locale: ptBR,
                      }
                    )}
                  </time>
                  <BsPerson size="1.0rem" />
                  <span>{post?.data?.author}</span>
                </a>
              </Link>
            ))}
            {nextPage && (
              <button type="button" onClick={handleLoadMore}>
                Carregar mais posts
              </button>
            )}
          </div>
        </main>
      </IconContext.Provider>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'publicationspace')],
    {
      fetch: [
        'publicationspace.title',
        'publicationspace.subtitle',
        'publicationspace.author',
      ],
      pageSize: 1,
      page: 1,
    }
  );

  console.log(JSON.stringify(postsResponse, null, 2));

  const posts = postsResponse.results.map((post: Post) => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const nextPage = postsResponse.next_page;

  return {
    props: {
      postsPagination: {
        results: posts,
        next_page: nextPage,
      },
    },
  };
};
