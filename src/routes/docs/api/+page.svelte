<script lang="ts">
  import StaticArticle from '$lib/components/StaticArticle.svelte';
  import { resolve } from '$app/paths';

  type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';
  type Category = 'Tasks' | 'Claims' | 'Verifications' | 'Badges' | 'Profile & Teams' | 'Auth';
  type AuthType = 'public' | 'user' | 'ngo' | 'admin';

  interface Endpoint {
    id: string;
    method: HttpMethod;
    path: string;
    category: Category;
    auth: string;
    summary: string;
    queryParams?: { name: string; type: string; required: boolean; description: string }[];
    requestBody?: string;
    responseStatus: string;
    responseBody: string;
    notes?: string;
  }

  let selectedCategory = $state<'All' | Category>('All');
  let selectedAuth = $state<'All' | AuthType>('All');
  let searchQuery = $state('');
  let copiedId = $state<string | null>(null);

  const categories: ('All' | Category)[] = [
    'All',
    'Tasks',
    'Claims',
    'Verifications',
    'Badges',
    'Profile & Teams',
    'Auth'
  ];

  const authRoles: { id: 'All' | AuthType; label: string }[] = [
    { id: 'All', label: 'All Roles' },
    { id: 'public', label: 'Public' },
    { id: 'user', label: 'Volunteer' },
    { id: 'ngo', label: 'NGO' },
    { id: 'admin', label: 'Admin' }
  ];

  const endpoints: Endpoint[] = [
    // Tasks
    {
      id: 'get-tasks',
      method: 'GET',
      path: '/api/tasks',
      category: 'Tasks',
      auth: 'Public (Optional)',
      summary: 'Retrieve public active task listings for volunteers and directory views.',
      queryParams: [
        { name: 'duration', type: 'number', required: false, description: 'Max duration in mins (e.g. 15, 30)' },
        { name: 'lang', type: 'string', required: false, description: 'Target ISO lang code (e.g. es, fr)' }
      ],
      responseStatus: '200 OK',
      responseBody: JSON.stringify(
        [
          {
            id: 'task_89f2a',
            title: 'Proofread Disaster Relief Guidelines',
            shortDescription: 'Review 3 pages of translated emergency response documentation.',
            tags: ['documentation', 'disaster-relief', 'translation'],
            estimatedMinutes: 15,
            language: 'English',
            isVerified: true
          }
        ],
        null,
        2
      )
    },
    {
      id: 'post-tasks',
      method: 'POST',
      path: '/api/tasks',
      category: 'Tasks',
      auth: 'NGO Role Required',
      summary: 'Create a new micro-task listing. Submissions undergo automated content safety checks.',
      requestBody: JSON.stringify(
        {
          title: 'Translate Sanitation Infographic',
          shortDescription: 'Translate a single-page hygiene graphic from English to Spanish.',
          description: 'Full text and context file link for translators...',
          language: 'Spanish',
          tags: ['translation', 'graphics', 'health'],
          estimatedMinutes: 20,
          maxVolunteers: 2,
          deadline: '2026-08-30T00:00:00Z'
        },
        null,
        2
      ),
      responseStatus: '201 Created',
      responseBody: JSON.stringify(
        {
          id: 'task_99b1c',
          orgId: 'user_ngo_402',
          title: 'Translate Sanitation Infographic',
          shortDescription: 'Translate a single-page hygiene graphic from English to Spanish.',
          description: 'Full text and context file link for translators...',
          language: 'Spanish',
          tags: ['translation', 'graphics', 'health'],
          estimatedMinutes: 20,
          status: 'active',
          maxVolunteers: 2,
          deadline: '2026-08-30T00:00:00Z',
          isVerified: true,
          lastActivityAt: '2026-07-31T08:30:00Z'
        },
        null,
        2
      ),
      notes: 'Task creation requires an active NGO session. Content safety moderation flags unsafe text.'
    },
    {
      id: 'patch-task-id',
      method: 'PATCH',
      path: '/api/tasks/[id]',
      category: 'Tasks',
      auth: 'NGO Task Owner',
      summary: 'Update task status (active, completed, paused), max volunteers, or deadline.',
      requestBody: JSON.stringify(
        {
          status: 'completed',
          maxVolunteers: 5,
          deadline: '2026-09-15T00:00:00Z'
        },
        null,
        2
      ),
      responseStatus: '200 OK',
      responseBody: JSON.stringify({ success: true }, null, 2)
    },
    {
      id: 'delete-task-id',
      method: 'DELETE',
      path: '/api/tasks/[id]',
      category: 'Tasks',
      auth: 'NGO Task Owner',
      summary: 'Delete or archive an existing task listing.',
      responseStatus: '200 OK',
      responseBody: JSON.stringify({ success: true }, null, 2)
    },
    {
      id: 'post-task-claim',
      method: 'POST',
      path: '/api/tasks/[id]/claim',
      category: 'Tasks',
      auth: 'Authenticated User',
      summary: 'Claim an active task and submit proof of completion with optional notes.',
      requestBody: JSON.stringify(
        {
          proofUrl: 'https://github.com/org/repo/pull/104',
          notes: 'Completed all translation strings and checked alt text.'
        },
        null,
        2
      ),
      responseStatus: '201 Created',
      responseBody: JSON.stringify(
        {
          id: 'claim_34a1',
          taskId: 'task_89f2a',
          userId: 'user_vol_77',
          proofUrl: 'https://github.com/org/repo/pull/104',
          notes: 'Completed all translation strings and checked alt text.',
          status: 'pending',
          createdAt: '2026-07-31T08:32:00Z'
        },
        null,
        2
      )
    },

    // Claims
    {
      id: 'get-claims',
      method: 'GET',
      path: '/api/claims',
      category: 'Claims',
      auth: 'Authenticated User',
      summary: 'Retrieve submitted task claims (volunteers see their own; NGOs see claims for their tasks).',
      queryParams: [
        { name: 'status', type: 'string', required: false, description: 'Filter: pending | approved | rejected' },
        { name: 'limit', type: 'number', required: false, description: 'Page limit (default 50, max 100)' },
        { name: 'offset', type: 'number', required: false, description: 'Page offset (default 0)' }
      ],
      responseStatus: '200 OK',
      responseBody: JSON.stringify(
        {
          data: [
            {
              id: 'claim_34a1',
              taskId: 'task_89f2a',
              userId: 'user_vol_77',
              proofUrl: 'https://github.com/org/repo/pull/104',
              notes: 'Completed all translation strings.',
              status: 'pending',
              createdAt: '2026-07-31T08:32:00Z'
            }
          ],
          meta: {
            total: 1,
            limit: 50,
            offset: 0,
            hasMore: false
          },
          error: null
        },
        null,
        2
      )
    },
    {
      id: 'post-claim-approve',
      method: 'POST',
      path: '/api/claims/[id]/approve',
      category: 'Claims',
      auth: 'NGO Owner / Admin',
      summary: 'Approve a volunteer claim, awarding XP and evaluating badge achievements.',
      responseStatus: '200 OK',
      responseBody: JSON.stringify(
        {
          id: 'claim_34a1',
          status: 'approved',
          badgeAwarded: true
        },
        null,
        2
      )
    },
    {
      id: 'post-claim-reject',
      method: 'POST',
      path: '/api/claims/[id]/reject',
      category: 'Claims',
      auth: 'NGO Owner / Admin',
      summary: 'Reject a claim with reviewer feedback notes.',
      requestBody: JSON.stringify(
        {
          reason: 'Uploaded proof screenshot link is inaccessible.'
        },
        null,
        2
      ),
      responseStatus: '200 OK',
      responseBody: JSON.stringify({ status: 'rejected' }, null, 2)
    },

    // Verifications
    {
      id: 'post-verifications',
      method: 'POST',
      path: '/api/verifications',
      category: 'Verifications',
      auth: 'NGO Role Required',
      summary: 'Submit NGO verification request with EIN and supporting document reference.',
      requestBody: JSON.stringify(
        {
          ein: '12-3456789',
          organizationName: 'Global Education Alliance',
          documentId: 'doc_99182'
        },
        null,
        2
      ),
      responseStatus: '201 Created',
      responseBody: JSON.stringify(
        {
          userId: 'user_ngo_402',
          ein: '12-3456789',
          organizationName: 'Global Education Alliance',
          documentId: 'doc_99182',
          status: 'pending',
          submittedAt: '2026-07-31T08:00:00Z'
        },
        null,
        2
      )
    },
    {
      id: 'get-verifications-me',
      method: 'GET',
      path: '/api/verifications/me',
      category: 'Verifications',
      auth: 'NGO Role Required',
      summary: 'Fetch the current user organization verification status.',
      responseStatus: '200 OK',
      responseBody: JSON.stringify(
        {
          status: 'approved',
          ein: '12-3456789',
          organizationName: 'Global Education Alliance'
        },
        null,
        2
      )
    },
    {
      id: 'delete-verifications-me',
      method: 'DELETE',
      path: '/api/verifications/me',
      category: 'Verifications',
      auth: 'NGO Role Required',
      summary: 'Cancel pending verification submission.',
      responseStatus: '200 OK',
      responseBody: JSON.stringify({ success: true }, null, 2)
    },
    {
      id: 'post-verifications-upload',
      method: 'POST',
      path: '/api/verifications/upload',
      category: 'Verifications',
      auth: 'NGO Role Required',
      summary: 'Upload official verification proof document (PDF or image).',
      requestBody: 'FormData: file (PDF, PNG, JPEG max 10MB)',
      responseStatus: '200 OK',
      responseBody: JSON.stringify(
        {
          fileId: 'doc_99182',
          url: '/api/verifications/user_ngo_402/document'
        },
        null,
        2
      )
    },
    {
      id: 'get-verification-document',
      method: 'GET',
      path: '/api/verifications/[userId]/document',
      category: 'Verifications',
      auth: 'Admin / Owner',
      summary: 'Download or inspect verification document file binary.',
      responseStatus: '200 OK',
      responseBody: '[Binary file stream: application/pdf or image/png]'
    },
    {
      id: 'post-verification-approve',
      method: 'POST',
      path: '/api/verifications/[userId]/approve',
      category: 'Verifications',
      auth: 'Admin Role',
      summary: 'Approve NGO verification and mark organization tasks as Verified.',
      responseStatus: '200 OK',
      responseBody: JSON.stringify({ success: true, verified: true }, null, 2)
    },
    {
      id: 'post-verification-reject',
      method: 'POST',
      path: '/api/verifications/[userId]/reject',
      category: 'Verifications',
      auth: 'Admin Role',
      summary: 'Reject NGO verification request with detailed rejection reason.',
      requestBody: JSON.stringify(
        {
          reason: 'Tax ID documentation could not be verified in state database.'
        },
        null,
        2
      ),
      responseStatus: '200 OK',
      responseBody: JSON.stringify({ success: true }, null, 2)
    },

    // Badges
    {
      id: 'get-badges',
      method: 'GET',
      path: '/api/badges',
      category: 'Badges',
      auth: 'Authenticated User',
      summary: 'Get earned badges for the current user or targeted user ID.',
      queryParams: [
        { name: 'userId', type: 'string', required: false, description: 'Target user ID (defaults to current user)' }
      ],
      responseStatus: '200 OK',
      responseBody: JSON.stringify(
        [
          {
            id: 'badge_first_task',
            name: 'First Response',
            description: 'Completed your first micro-task on MicroMatch.',
            icon: 'heroicons:sparkles',
            unlockedAt: '2026-07-28T14:20:00Z'
          }
        ],
        null,
        2
      )
    },
    {
      id: 'get-badges-manage',
      method: 'GET',
      path: '/api/badges/manage',
      category: 'Badges',
      auth: 'NGO / Admin',
      summary: 'List custom badge templates defined by the organization.',
      responseStatus: '200 OK',
      responseBody: JSON.stringify(
        [
          {
            id: 'badge_custom_01',
            name: 'Translation Hero',
            description: 'Awarded for completing 5 translation micro-tasks.',
            icon: 'heroicons:language',
            triggerTag: 'translation',
            requiredCount: 5
          }
        ],
        null,
        2
      )
    },
    {
      id: 'post-badges-manage',
      method: 'POST',
      path: '/api/badges/manage',
      category: 'Badges',
      auth: 'NGO / Admin',
      summary: 'Define a custom badge template for volunteer achievements.',
      requestBody: JSON.stringify(
        {
          name: 'Accessibility Champion',
          description: 'Awarded for completing 5 accessibility review tasks.',
          icon: 'heroicons:eye',
          triggerTag: 'accessibility',
          requiredCount: 5
        },
        null,
        2
      ),
      responseStatus: '201 Created',
      responseBody: JSON.stringify(
        {
          id: 'badge_custom_02',
          name: 'Accessibility Champion',
          description: 'Awarded for completing 5 accessibility review tasks.',
          icon: 'heroicons:eye',
          triggerTag: 'accessibility',
          requiredCount: 5,
          orgId: 'user_ngo_402'
        },
        null,
        2
      )
    },
    {
      id: 'delete-badges-manage',
      method: 'DELETE',
      path: '/api/badges/manage',
      category: 'Badges',
      auth: 'NGO / Admin',
      summary: 'Delete a custom badge template.',
      requestBody: JSON.stringify({ id: 'badge_custom_02' }, null, 2),
      responseStatus: '200 OK',
      responseBody: JSON.stringify({ success: true }, null, 2)
    },

    // Profile & Teams
    {
      id: 'post-profile-role',
      method: 'POST',
      path: '/api/profile/role',
      category: 'Profile & Teams',
      auth: 'Authenticated User',
      summary: 'Switch current active account view role between Volunteer and NGO.',
      requestBody: JSON.stringify({ role: 'ngo' }, null, 2),
      responseStatus: '200 OK',
      responseBody: JSON.stringify({ success: true, role: 'ngo' }, null, 2)
    },
    {
      id: 'post-profile-update',
      method: 'POST',
      path: '/api/profile/update',
      category: 'Profile & Teams',
      auth: 'Authenticated User',
      summary: 'Update profile information (display name, bio, skills, organization name).',
      requestBody: JSON.stringify(
        {
          name: 'Elena Rostova',
          bio: 'Bilingual tech volunteer passionate about health accessibility.',
          skills: ['Spanish Translation', 'Proofreading', 'UI Testing'],
          orgName: 'Community Health First'
        },
        null,
        2
      ),
      responseStatus: '200 OK',
      responseBody: JSON.stringify({ success: true }, null, 2)
    },
    {
      id: 'post-profile-avatar',
      method: 'POST',
      path: '/api/profile/avatar',
      category: 'Profile & Teams',
      auth: 'Authenticated User',
      summary: 'Upload user profile avatar image.',
      requestBody: 'FormData: avatar (JPEG, PNG, WEBP max 5MB)',
      responseStatus: '200 OK',
      responseBody: JSON.stringify({ avatarUrl: 'https://trymicromatch.com/storage/avatars/user_vol_77.jpg' }, null, 2)
    },
    {
      id: 'post-teams-assign',
      method: 'POST',
      path: '/api/teams/assign',
      category: 'Profile & Teams',
      auth: 'NGO Role Required',
      summary: 'Assign a task directly to specific team members.',
      requestBody: JSON.stringify(
        {
          taskId: 'task_89f2a',
          memberIds: ['user_vol_77', 'user_vol_88']
        },
        null,
        2
      ),
      responseStatus: '200 OK',
      responseBody: JSON.stringify({ success: true }, null, 2)
    },

    // Auth
    {
      id: 'post-auth-session',
      method: 'POST',
      path: '/api/auth/session',
      category: 'Auth',
      auth: 'Public',
      summary: 'Exchange provider auth token for HTTP-only session cookie.',
      requestBody: JSON.stringify({ token: 'sess_token_secure_abc123' }, null, 2),
      responseStatus: '200 OK',
      responseBody: JSON.stringify({ success: true }, null, 2)
    },
    {
      id: 'post-auth-logout',
      method: 'POST',
      path: '/api/auth/logout',
      category: 'Auth',
      auth: 'Authenticated User',
      summary: 'Destroy current active authentication session.',
      responseStatus: '200 OK',
      responseBody: JSON.stringify({ success: true }, null, 2)
    }
  ];

  function getAuthType(auth: string): AuthType {
    const lower = auth.toLowerCase();
    if (lower.includes('admin')) return 'admin';
    if (lower.includes('ngo')) return 'ngo';
    if (lower.includes('authenticated') || lower.includes('volunteer')) return 'user';
    return 'public';
  }

  const filteredEndpoints = $derived(
    endpoints.filter((ep) => {
      const matchCat = selectedCategory === 'All' || ep.category === selectedCategory;
      const matchAuth = selectedAuth === 'All' || getAuthType(ep.auth) === selectedAuth;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        ep.path.toLowerCase().includes(q) ||
        ep.method.toLowerCase().includes(q) ||
        ep.summary.toLowerCase().includes(q) ||
        ep.category.toLowerCase().includes(q) ||
        ep.auth.toLowerCase().includes(q);
      return matchCat && matchAuth && matchSearch;
    })
  );

  function copySnippet(id: string, text: string) {
    navigator.clipboard.writeText(text);
    copiedId = id;
    setTimeout(() => {
      if (copiedId === id) copiedId = null;
    }, 2000);
  }

  function resetFilters() {
    searchQuery = '';
    selectedCategory = 'All';
    selectedAuth = 'All';
  }
</script>

<StaticArticle
  title="MicroMatch Developer API"
  lede="Complete REST API reference for public task discovery, volunteer claims, NGO verifications, badges, teams, and authentication."
  updated="July 31, 2026"
  wide={true}
  showRelated={false}
>
  <div class="api-header-hero">
    <div class="header-title-badge">
      <span class="brand-pill">MicroMatch</span>
      <span class="title-tech-tag">REST API v1</span>
    </div>
  </div>

  <div class="api-overview">
    <div class="overview-grid">
      <div class="overview-card">
        <h3>Base URL</h3>
        <code>https://trymicromatch.com</code>
      </div>
      <div class="overview-card">
        <h3>Authentication</h3>
        <p>Public endpoints require no tokens. Protected endpoints use HTTP session cookies or session headers.</p>
      </div>
      <div class="overview-card">
        <h3>Content Safety</h3>
        <p>Automated moderation scans titles, descriptions, and claim notes. Violations return <code>400 Bad Request</code>.</p>
      </div>
    </div>
  </div>

  <div class="controls-bar">
    <div class="search-row">
      <div class="search-box">
        <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
          <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
        </svg>
        <input
          type="text"
          placeholder="Filter endpoints by keyword, path, or role (e.g., /api/tasks, NGO, claim)..."
          bind:value={searchQuery}
        />
        {#if searchQuery}
          <button class="clear-btn" onclick={() => (searchQuery = '')}>&times;</button>
        {/if}
      </div>

      {#if selectedCategory !== 'All' || selectedAuth !== 'All' || searchQuery}
        <button class="reset-all-btn" onclick={resetFilters}>
          Reset Filters &times;
        </button>
      {/if}
    </div>

    <div class="filters-row">
      <div class="filter-group">
        <span class="group-label">Category:</span>
        <div class="category-pills" role="tablist" aria-label="API Categories">
          {#each categories as cat (cat)}
            <button
              class="pill-btn"
              class:active={selectedCategory === cat}
              onclick={() => (selectedCategory = cat)}
            >
              {cat}
              <span class="count-tag">
                {cat === 'All' ? endpoints.length : endpoints.filter((e) => e.category === cat).length}
              </span>
            </button>
          {/each}
        </div>
      </div>

      <div class="filter-group">
        <span class="group-label">Access Role:</span>
        <div class="auth-filter-pills" role="tablist" aria-label="Auth Role Filters">
          {#each authRoles as role (role.id)}
            <button
              class="auth-pill-btn auth-{role.id}"
              class:active={selectedAuth === role.id}
              onclick={() => (selectedAuth = selectedAuth === role.id ? 'All' : role.id)}
            >
              {#if role.id === 'public'}
                <svg class="auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
              {:else if role.id === 'user'}
                <svg class="auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              {:else if role.id === 'ngo'}
                <svg class="auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 21h18"></path>
                  <path d="M6 21V7l6-4 6 4v14"></path>
                  <path d="M9 10h.01"></path>
                  <path d="M15 10h.01"></path>
                  <path d="M9 14h.01"></path>
                  <path d="M15 14h.01"></path>
                </svg>
              {:else if role.id === 'admin'}
                <svg class="auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
              {/if}
              {role.label}
              <span class="count-tag">
                {role.id === 'All' ? endpoints.length : endpoints.filter((e) => getAuthType(e.auth) === role.id).length}
              </span>
            </button>
          {/each}
        </div>
      </div>
    </div>
  </div>

  <div class="endpoints-list">
    {#if filteredEndpoints.length === 0}
      <div class="empty-state">
        <p>No endpoints match your active filter parameters.</p>
        <button class="reset-link" onclick={resetFilters}>Reset all filters</button>
      </div>
    {:else}
      {#each filteredEndpoints as ep (ep.id)}
        <div class="endpoint-card" id={ep.id}>
          <div class="card-header">
            <div class="title-group">
              <span class="method-badge method-{ep.method.toLowerCase()}">{ep.method}</span>
              <span class="path-text">{ep.path}</span>
            </div>
            <div class="meta-group">
              <button
                type="button"
                class="auth-badge auth-{getAuthType(ep.auth)}"
                class:active-filter={selectedAuth === getAuthType(ep.auth)}
                onclick={() => (selectedAuth = selectedAuth === getAuthType(ep.auth) ? 'All' : getAuthType(ep.auth))}
                title="Click to toggle filter by this role"
              >
                {#if getAuthType(ep.auth) === 'public'}
                  <svg class="auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                {:else if getAuthType(ep.auth) === 'user'}
                  <svg class="auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                {:else if getAuthType(ep.auth) === 'ngo'}
                  <svg class="auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 21h18"></path>
                    <path d="M6 21V7l6-4 6 4v14"></path>
                    <path d="M9 10h.01"></path>
                    <path d="M15 10h.01"></path>
                    <path d="M9 14h.01"></path>
                    <path d="M15 14h.01"></path>
                  </svg>
                {:else if getAuthType(ep.auth) === 'admin'}
                  <svg class="auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    <path d="m9 12 2 2 4-4"></path>
                  </svg>
                {/if}
                {ep.auth}
              </button>
              <button
                class="copy-btn"
                onclick={() => copySnippet(ep.id, `curl -X ${ep.method} https://trymicromatch.com${ep.path}`)}
                title="Copy cURL snippet"
              >
                {#if copiedId === ep.id}
                  ✓ Copied cURL
                {:else}
                  Copy cURL
                {/if}
              </button>
            </div>
          </div>

          <div class="card-grid">
            <div class="card-left-col">
              <p class="endpoint-summary">{ep.summary}</p>

              {#if ep.queryParams && ep.queryParams.length > 0}
                <div class="section-block">
                  <h4 class="section-title">Query Parameters</h4>
                  <div class="table-wrapper">
                    <table class="params-table">
                      <thead>
                        <tr>
                          <th>Parameter</th>
                          <th>Type</th>
                          <th>Req</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {#each ep.queryParams as param (param.name)}
                          <tr>
                            <td><code>{param.name}</code></td>
                            <td><span class="type-tag">{param.type}</span></td>
                            <td><span class="req-tag" class:is-req={param.required}>{param.required ? 'Yes' : 'Opt'}</span></td>
                            <td>{param.description}</td>
                          </tr>
                        {/each}
                      </tbody>
                    </table>
                  </div>
                </div>
              {/if}

              {#if ep.notes}
                <div class="note-box">
                  <p><strong>Note:</strong> {ep.notes}</p>
                </div>
              {/if}
            </div>

            <div class="card-right-col">
              {#if ep.requestBody}
                <div class="section-block">
                  <h4 class="section-title">Request Body</h4>
                  <pre class="code-block"><code>{ep.requestBody}</code></pre>
                </div>
              {/if}

              <div class="section-block">
                <div class="response-header">
                  <h4 class="section-title">Response</h4>
                  <span class="status-badge">{ep.responseStatus}</span>
                </div>
                <pre class="code-block"><code>{ep.responseBody}</code></pre>
              </div>
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>

  <div class="back-link-wrapper">
    <a href={resolve('/docs', {})} class="back-link">← Back to Documentation</a>
  </div>
</StaticArticle>

<style>
  .api-header-hero {
    margin-bottom: 20px;
  }

  .header-title-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 4px 6px 4px 6px;
    background: var(--color-surface-variant, #f8fafc);
    border: 1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.08));
    border-radius: 24px;
  }

  .brand-pill {
    font-size: 0.775rem;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 16px;
    background: var(--color-primary, #ff6b6b);
    color: #ffffff;
    letter-spacing: 0.02em;
  }

  .title-tech-tag {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.775rem;
    font-weight: 700;
    padding: 3px 10px;
    color: var(--color-text-secondary, #475569);
    letter-spacing: 0.04em;
  }

  .api-overview {
    margin-bottom: var(--space-6, 24px);
  }

  .overview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 16px;
  }

  .overview-card {
    background: var(--color-surface-variant, #f8fafc);
    border: 1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.08));
    border-radius: 12px;
    padding: 18px 22px;
  }

  .overview-card h3 {
    font-size: 0.95rem;
    font-weight: 700;
    margin: 0 0 8px 0;
    color: var(--color-text, #0f172a);
    letter-spacing: -0.01em;
  }

  .overview-card p {
    font-size: 0.875rem !important;
    line-height: 1.45 !important;
    margin: 0 !important;
    color: var(--color-text-secondary, #475569) !important;
  }

  .overview-card code {
    background: rgba(0, 0, 0, 0.04);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.825rem;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }

  .controls-bar {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 28px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.08));
  }

  .search-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .search-box {
    position: relative;
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 280px;
  }

  .search-icon {
    position: absolute;
    left: 14px;
    color: var(--color-text-secondary, #64748b);
    pointer-events: none;
  }

  .search-box input {
    width: 100%;
    padding: 11px 38px 11px 40px;
    font-size: 0.9rem;
    border-radius: 10px;
    border: 1px solid var(--color-outline, #cbd5e1);
    background: var(--color-surface, #ffffff);
    color: var(--color-text, #0f172a);
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .search-box input:focus {
    outline: none;
    border-color: var(--color-primary, #ff6b6b);
    box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.15);
  }

  .clear-btn {
    position: absolute;
    right: 12px;
    background: transparent;
    border: none;
    font-size: 1.2rem;
    color: var(--color-text-secondary, #64748b);
    cursor: pointer;
    padding: 0 4px;
  }

  .reset-all-btn {
    font-size: 0.825rem;
    font-weight: 700;
    padding: 8px 14px;
    border-radius: 8px;
    border: 1px solid #fca5a5;
    background: #fef2f2;
    color: #b91c1c;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .reset-all-btn:hover {
    background: #fee2e2;
  }

  .filters-row {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .filter-group {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .group-label {
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-text-secondary, #64748b);
    min-width: 90px;
  }

  .category-pills,
  .auth-filter-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .pill-btn,
  .auth-pill-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 0.825rem;
    font-weight: 600;
    border: 1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.1));
    background: var(--color-surface-variant, #f1f5f9);
    color: var(--color-text-secondary, #475569);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .pill-btn:hover,
  .auth-pill-btn:hover {
    filter: brightness(0.96);
  }

  .pill-btn.active {
    background: var(--color-primary, #ff6b6b);
    color: #ffffff;
    border-color: var(--color-primary, #ff6b6b);
  }

  .auth-pill-btn.auth-public.active {
    background: #047857;
    color: #ffffff;
    border-color: #047857;
  }

  .auth-pill-btn.auth-user.active {
    background: #1d4ed8;
    color: #ffffff;
    border-color: #1d4ed8;
  }

  .auth-pill-btn.auth-ngo.active {
    background: #be123c;
    color: #ffffff;
    border-color: #be123c;
  }

  .auth-pill-btn.auth-admin.active {
    background: #b45309;
    color: #ffffff;
    border-color: #b45309;
  }

  .count-tag {
    font-size: 0.75rem;
    padding: 1px 6px;
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.08);
  }

  .active .count-tag {
    background: rgba(255, 255, 255, 0.25);
  }

  .endpoints-list {
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .endpoint-card {
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.1));
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .endpoint-card:hover {
    border-color: rgba(255, 107, 107, 0.4);
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);
  }

  .card-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-bottom: 16px;
    margin-bottom: 16px;
    border-bottom: 1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.06));
  }

  .title-group {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .method-badge {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.8rem;
    font-weight: 800;
    padding: 4px 10px;
    border-radius: 6px;
    letter-spacing: 0.04em;
  }

  .method-get {
    background: #dcfce7;
    color: #15803d;
  }

  .method-post {
    background: #dbeafe;
    color: #1d4ed8;
  }

  .method-patch {
    background: #fef3c7;
    color: #b45309;
  }

  .method-delete {
    background: #ffe4e6;
    color: #be123c;
  }

  .path-text {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-text, #0f172a);
    word-break: break-word;
  }

  .meta-group {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .auth-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.775rem;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .auth-badge:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  }

  .auth-badge.active-filter {
    outline: 2px solid currentColor;
    outline-offset: 1px;
    font-weight: 700;
  }

  .auth-icon {
    width: 13px;
    height: 13px;
    flex-shrink: 0;
  }

  .auth-public {
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #a7f3d0;
  }

  .auth-user {
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
  }

  .auth-ngo {
    background: #fff1f2;
    color: #be123c;
    border: 1px solid #fecdd3;
  }

  .auth-admin {
    background: #fffbeb;
    color: #b45309;
    border: 1px solid #fde68a;
  }

  .copy-btn {
    font-size: 0.775rem;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 6px;
    border: 1px solid var(--color-outline-variant, #cbd5e1);
    background: var(--color-surface-variant, #f8fafc);
    color: var(--color-text, #334155);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .copy-btn:hover {
    background: #e2e8f0;
  }

  .card-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
  }

  @media (min-width: 900px) {
    .card-grid {
      grid-template-columns: 1fr 1fr;
      align-items: start;
    }
  }

  .endpoint-summary {
    font-size: 0.95rem !important;
    line-height: 1.55 !important;
    color: var(--color-text-secondary, #334155) !important;
    margin: 0 0 16px 0 !important;
  }

  .section-block {
    margin-top: 14px;
  }

  .section-title {
    font-size: 0.825rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-secondary, #64748b);
    margin: 0 0 8px 0;
  }

  .response-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
  }

  .status-badge {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.75rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 4px;
    background: #e0f2fe;
    color: #0369a1;
  }

  .table-wrapper {
    overflow-x: auto;
    border: 1px solid var(--color-outline-variant, #e2e8f0);
    border-radius: 8px;
  }

  .params-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
    text-align: left;
  }

  .params-table th {
    background: var(--color-surface-variant, #f8fafc);
    padding: 8px 10px;
    font-weight: 700;
    color: #475569;
    border-bottom: 1px solid #e2e8f0;
  }

  .params-table td {
    padding: 8px 10px;
    border-bottom: 1px solid #f1f5f9;
    color: var(--color-text, #0f172a);
  }

  .params-table tr:last-child td {
    border-bottom: none;
  }

  .type-tag {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.775rem;
    color: #6366f1;
  }

  .req-tag {
    font-size: 0.75rem;
    font-weight: 600;
    color: #64748b;
  }

  .req-tag.is-req {
    color: #dc2626;
  }

  .code-block {
    background: #0f172a;
    color: #f8fafc;
    padding: 14px 16px;
    border-radius: 10px;
    font-family: var(--font-mono, 'JetBrains Mono', 'Fira Code', monospace);
    font-size: 0.825rem;
    line-height: 1.5;
    overflow-x: auto;
    margin: 0;
    max-height: 420px;
  }

  .note-box {
    margin-top: 16px;
    padding: 12px 14px;
    background: #fffbeeb0;
    border: 1px solid #fef08a;
    border-radius: 8px;
  }

  .note-box p {
    font-size: 0.85rem !important;
    line-height: 1.45 !important;
    margin: 0 !important;
    color: #854d0e !important;
  }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
    background: var(--color-surface-variant, #f8fafc);
    border-radius: 12px;
    border: 1px dashed var(--color-outline-variant, #cbd5e1);
  }

  .reset-link {
    margin-top: 10px;
    background: none;
    border: none;
    color: var(--color-primary, #ff6b6b);
    font-weight: 700;
    cursor: pointer;
    text-decoration: underline;
  }

  .back-link-wrapper {
    margin-top: 36px;
    padding-top: 20px;
    border-top: 1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.08));
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    font-weight: 700 !important;
  }

  @media (max-width: 640px) {
    .card-header {
      flex-direction: column;
      align-items: flex-start;
    }
    .code-block {
      font-size: 0.775rem;
      padding: 10px 12px;
      max-width: 100%;
      box-sizing: border-box;
      white-space: pre-wrap;
      word-break: break-word;
    }
  }
</style>
