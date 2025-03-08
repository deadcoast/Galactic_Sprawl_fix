import React, { useState } from 'react';
import { z } from 'zod';
import { createApiClient } from '../../../api/TypeSafeApiClient';
import { UseApiOptions, useTypedApi } from '../../../hooks/useTypedApi';

// Define schemas for our API types
const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  username: z.string(),
  website: z.string().optional(),
});

const userListSchema = z.array(userSchema);

const todoSchema = z.object({
  id: z.number(),
  userId: z.number(),
  title: z.string(),
  completed: z.boolean(),
});

const todoListSchema = z.array(todoSchema);

const postSchema = z.object({
  id: z.number(),
  userId: z.number(),
  title: z.string(),
  body: z.string(),
});

const createPostSchema = z.object({
  userId: z.number(),
  title: z.string(),
  body: z.string(),
});

// Infer types from schemas
type User = z.infer<typeof userSchema>;
type Todo = z.infer<typeof todoSchema>;
type Post = z.infer<typeof postSchema>;
type CreatePost = z.infer<typeof createPostSchema>;

// Create a client instance
const apiClient = createApiClient({
  baseUrl: 'https://jsonplaceholder.typicode.com',
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: false,
  throwOnValidationError: true,
  onError: error => {
    console.error('API Error:', error);
  },
});

// Custom hook options
const apiOptions: UseApiOptions = {
  retry: true,
  maxRetries: 2,
  enableCache: true,
  cacheTTL: 60 * 1000, // 1 minute
};

const TypeSafeApiDemo: React.FC = () => {
  const { useQuery, useMutation } = useTypedApi(apiClient);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showTodos, setShowTodos] = useState(false);
  const [showPosts, setShowPosts] = useState(false);
  const [postForm, setPostForm] = useState<CreatePost>({
    userId: 1,
    title: '',
    body: '',
  });

  // Query for users
  const {
    data: users,
    isLoading: usersLoading,
    isError: usersError,
    error: usersErrorDetails,
    refetch: refetchUsers,
  } = useQuery('/users', userListSchema, {
    ...apiOptions,
  });

  // Conditional query for todos based on selected user
  const {
    data: todos,
    isLoading: todosLoading,
    isError: todosError,
    refetch: refetchTodos,
  } = useQuery(`/todos?userId=${selectedUserId}`, todoListSchema, {
    ...apiOptions,
    skip: !selectedUserId || !showTodos,
    dependencies: [selectedUserId, showTodos],
  });

  // Conditional query for posts based on selected user
  const {
    data: posts,
    isLoading: postsLoading,
    isError: postsError,
    refetch: refetchPosts,
  } = useQuery(`/posts?userId=${selectedUserId}`, todoListSchema, {
    ...apiOptions,
    skip: !selectedUserId || !showPosts,
    dependencies: [selectedUserId, showPosts],
  });

  // Mutation for creating new posts
  const {
    execute: createPost,
    isLoading: createPostLoading,
    isError: createPostError,
    isSuccess: createPostSuccess,
    data: createdPost,
  } = useMutation<CreatePost, Post, typeof createPostSchema, typeof postSchema>(
    'POST',
    '/posts',
    createPostSchema,
    postSchema,
    apiOptions
  );

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPost(postForm);
      // Reset form if successful
      if (!createPostError) {
        setPostForm({
          userId: selectedUserId || 1,
          title: '',
          body: '',
        });
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleUserSelect = (userId: number) => {
    setSelectedUserId(userId === selectedUserId ? null : userId);
  };

  return (
    <div className="type-safe-api-demo">
      <h1>Type-Safe API Demo</h1>

      <div className="api-section">
        <h2>Users</h2>
        <div className="api-controls">
          <button onClick={() => refetchUsers()} disabled={usersLoading}>
            {usersLoading ? 'Loading...' : 'Refresh Users'}
          </button>
        </div>

        {usersError && (
          <div className="error-display">
            <h3>Error Loading Users</h3>
            <pre>{JSON.stringify(usersErrorDetails, null, 2)}</pre>
          </div>
        )}

        <div className="user-list">
          {users?.map(user => (
            <div
              key={user.id}
              className={`user-item ${selectedUserId === user.id ? 'selected' : ''}`}
              onClick={() => handleUserSelect(user.id)}
            >
              <h3>{user.name}</h3>
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              <p>
                <strong>Username:</strong> {user.username}
              </p>
              {user.website && (
                <p>
                  <strong>Website:</strong> {user.website}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedUserId && (
        <div className="user-data-section">
          <h2>User Data</h2>
          <div className="data-toggles">
            <button className={showTodos ? 'active' : ''} onClick={() => setShowTodos(!showTodos)}>
              {showTodos ? 'Hide Todos' : 'Show Todos'}
            </button>
            <button className={showPosts ? 'active' : ''} onClick={() => setShowPosts(!showPosts)}>
              {showPosts ? 'Hide Posts' : 'Show Posts'}
            </button>
          </div>

          {showTodos && (
            <div className="todos-section">
              <h3>Todos</h3>
              {todosLoading ? (
                <p>Loading todos...</p>
              ) : todosError ? (
                <p className="error">Error loading todos</p>
              ) : (
                <ul className="todo-list">
                  {todos?.map(todo => (
                    <li key={todo.id} className={todo.completed ? 'completed' : ''}>
                      <input type="checkbox" checked={todo.completed} readOnly />
                      <span>{todo.title}</span>
                    </li>
                  ))}
                </ul>
              )}
              <button onClick={() => refetchTodos()} disabled={todosLoading}>
                Refresh Todos
              </button>
            </div>
          )}

          {showPosts && (
            <div className="posts-section">
              <h3>Posts</h3>
              {postsLoading ? (
                <p>Loading posts...</p>
              ) : postsError ? (
                <p className="error">Error loading posts</p>
              ) : (
                <div className="post-list">
                  {posts?.map(post => (
                    <div key={post.id} className="post-item">
                      <h4>{post.title}</h4>
                      <p>{post.body}</p>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => refetchPosts()} disabled={postsLoading}>
                Refresh Posts
              </button>
            </div>
          )}

          <div className="create-post-section">
            <h3>Create New Post</h3>
            <form onSubmit={handleCreatePost}>
              <div className="form-group">
                <label htmlFor="post-title">Title:</label>
                <input
                  id="post-title"
                  type="text"
                  value={postForm.title}
                  onChange={e => setPostForm({ ...postForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="post-body">Body:</label>
                <textarea
                  id="post-body"
                  value={postForm.body}
                  onChange={e => setPostForm({ ...postForm, body: e.target.value })}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={createPostLoading || !postForm.title || !postForm.body}
              >
                {createPostLoading ? 'Creating...' : 'Create Post'}
              </button>
            </form>

            {createPostSuccess && (
              <div className="success-message">
                <h4>Post Created Successfully!</h4>
                <pre>{JSON.stringify(createdPost, null, 2)}</pre>
              </div>
            )}

            {createPostError && (
              <div className="error-message">
                <h4>Error Creating Post</h4>
                <p>Please try again</p>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .type-safe-api-demo {
          font-family:
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            Roboto,
            sans-serif;
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
        }

        h1,
        h2,
        h3,
        h4 {
          color: #333;
        }

        .api-section,
        .user-data-section {
          margin-bottom: 30px;
          padding: 20px;
          border-radius: 8px;
          background-color: #f5f5f5;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .api-controls {
          margin-bottom: 15px;
        }

        button {
          padding: 8px 16px;
          background-color: #4a6cf7;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          margin-right: 10px;
          transition: background-color 0.2s;
        }

        button:hover {
          background-color: #3a5ce5;
        }

        button:disabled {
          background-color: #a0a0a0;
          cursor: not-allowed;
        }

        button.active {
          background-color: #2d9d3a;
        }

        .user-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 15px;
        }

        .user-item {
          background-color: white;
          border-radius: 6px;
          padding: 15px;
          cursor: pointer;
          transition:
            transform 0.2s,
            box-shadow 0.2s;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .user-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .user-item.selected {
          border: 2px solid #4a6cf7;
          box-shadow: 0 0 0 2px rgba(74, 108, 247, 0.3);
        }

        .user-item h3 {
          margin-top: 0;
          margin-bottom: 10px;
        }

        .user-item p {
          margin: 5px 0;
          font-size: 14px;
        }

        .data-toggles {
          margin-bottom: 20px;
        }

        .todo-list {
          list-style-type: none;
          padding: 0;
        }

        .todo-list li {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
          padding: 10px;
          background-color: white;
          border-radius: 4px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .todo-list li.completed span {
          text-decoration: line-through;
          color: #888;
        }

        .todo-list li input {
          margin-right: 10px;
        }

        .post-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 15px;
          margin-bottom: 15px;
        }

        .post-item {
          background-color: white;
          border-radius: 6px;
          padding: 15px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .post-item h4 {
          margin-top: 0;
          margin-bottom: 10px;
          font-size: 16px;
        }

        .post-item p {
          font-size: 14px;
          color: #555;
        }

        .create-post-section {
          margin-top: 30px;
          padding: 20px;
          border-radius: 8px;
          background-color: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .form-group {
          margin-bottom: 15px;
        }

        label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }

        input,
        textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        textarea {
          min-height: 100px;
          resize: vertical;
        }

        .success-message {
          margin-top: 20px;
          padding: 15px;
          background-color: #e6f7e6;
          border-left: 4px solid #2d9d3a;
          border-radius: 4px;
        }

        .error-message {
          margin-top: 20px;
          padding: 15px;
          background-color: #f7e6e6;
          border-left: 4px solid #d93838;
          border-radius: 4px;
        }

        .error-display {
          margin: 20px 0;
          padding: 15px;
          background-color: #f7e6e6;
          border-left: 4px solid #d93838;
          border-radius: 4px;
        }

        pre {
          background-color: #f0f0f0;
          padding: 10px;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};

export default TypeSafeApiDemo;
