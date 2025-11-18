import { ROUTES, NAV_GROUPS } from './data/routes.js';

const routeMap = new Map(ROUTES.map((route) => [route.path, route]));

const state = {
  currentPath: resolvePath(location.hash),
  searchRaw: '',
  searchQuery: '',
};

const ROLE_LABELS = {
  advertiser: 'Рекламодатель',
  agency: 'Агентство',
  blogger: 'Блогер',
  admin: 'Администратор',
  bot: 'Telegram Bot/WebView',
  general: 'Общее',
};

const appNode = document.getElementById('app');

function resolvePath(hash) {
  const clean = (hash || '').replace(/^#/, '') || '/';
  return routeMap.has(clean) ? clean : '/';
}

function navigate(path) {
  if (path === state.currentPath) return;
  if (routeMap.has(path)) {
    window.location.hash = path;
  }
}

function filterPaths(paths) {
  if (!state.searchQuery) return paths;
  return paths.filter((path) => {
    const route = routeMap.get(path);
    const searchable = `${path} ${(route?.title ?? '').toLowerCase()} ${(route?.summary ?? '').toLowerCase()}`;
    return searchable.includes(state.searchQuery);
  });
}

function render() {
  state.currentPath = resolvePath(location.hash);
  const route = routeMap.get(state.currentPath) ?? routeMap.get('/');

  appNode.innerHTML = '';
  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar';

  const logo = document.createElement('div');
  logo.className = 'logo';
  logo.textContent = 'Telegram CPP · Prototype';
  sidebar.appendChild(logo);

  const caption = document.createElement('div');
  caption.className = 'caption';
  caption.textContent = 'Навигация по ключевым путям из спецификаций';
  sidebar.appendChild(caption);

  const search = document.createElement('input');
  search.type = 'search';
  search.className = 'search-input';
  search.placeholder = 'Поиск по маршруту...';
  search.value = state.searchRaw;
  search.addEventListener('input', (event) => {
    state.searchRaw = event.target.value;
    state.searchQuery = event.target.value.trim().toLowerCase();
    render();
  });
  sidebar.appendChild(search);

  let anyGroupRendered = false;
  NAV_GROUPS.forEach((group) => {
    const filtered = filterPaths(group.paths);
    if (!filtered.length) return;
    anyGroupRendered = true;
    const wrapper = document.createElement('div');
    wrapper.className = 'nav-group';

    const title = document.createElement('div');
    title.className = 'nav-group-title';
    title.textContent = group.title;
    wrapper.appendChild(title);

    filtered.forEach((path) => {
      const link = document.createElement('a');
      link.href = `#${path}`;
      link.textContent = routeMap.get(path)?.title ?? path;
      link.className = `nav-link${state.currentPath === path ? ' active' : ''}`;
      link.addEventListener('click', (event) => {
        event.preventDefault();
        navigate(path);
      });
      wrapper.appendChild(link);
    });

    sidebar.appendChild(wrapper);
  });

  if (!anyGroupRendered) {
    const empty = document.createElement('div');
    empty.className = 'empty-message';
    empty.textContent = 'Маршруты не найдены — скорректируйте запрос.';
    sidebar.appendChild(empty);
  }

  const main = document.createElement('main');
  main.appendChild(renderRouteCard(route));

  main.appendChild(renderConnections(route));

  appNode.appendChild(sidebar);
  appNode.appendChild(main);
}

function renderRouteCard(route) {
  const article = document.createElement('article');
  article.className = 'route-card';

  const header = document.createElement('div');
  header.className = 'route-header';

  const titleNode = document.createElement('h1');
  titleNode.className = 'route-title';
  titleNode.textContent = route.title;
  header.appendChild(titleNode);

  const pathNode = document.createElement('code');
  pathNode.className = 'route-path';
  pathNode.textContent = route.path;
  header.appendChild(pathNode);

  article.appendChild(header);

  const meta = document.createElement('div');
  meta.className = 'meta';

  const roleBadge = document.createElement('span');
  roleBadge.className = `badge role-${route.role ?? 'general'}`;
  roleBadge.textContent = ROLE_LABELS[route.role] ?? 'Общее';
  meta.appendChild(roleBadge);

  if (route.stage) {
    const stage = document.createElement('span');
    stage.className = 'badge role-general';
    stage.textContent = route.stage;
    meta.appendChild(stage);
  }

  article.appendChild(meta);

  if (route.summary) {
    const summary = document.createElement('p');
    summary.textContent = route.summary;
    article.appendChild(summary);
  }

  if (route.actions?.length) {
    const sectionTitle = document.createElement('div');
    sectionTitle.className = 'section-title';
    sectionTitle.textContent = 'Ключевые действия';
    article.appendChild(sectionTitle);

    const list = document.createElement('ul');
    route.actions.forEach((action) => {
      const li = document.createElement('li');
      li.textContent = action;
      list.appendChild(li);
    });
    article.appendChild(list);
  }

  if (route.artifacts?.length) {
    const sectionTitle = document.createElement('div');
    sectionTitle.className = 'section-title';
    sectionTitle.textContent = 'Содержимое экрана';
    article.appendChild(sectionTitle);

    const grid = document.createElement('div');
    grid.className = 'grid';
    route.artifacts.forEach((artifact) => {
      const card = document.createElement('div');
      card.className = 'card';

      const cardTitle = document.createElement('div');
      cardTitle.className = 'card-title';
      cardTitle.textContent = artifact.title;
      card.appendChild(cardTitle);

      const list = document.createElement('ul');
      artifact.items.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item;
        list.appendChild(li);
      });
      card.appendChild(list);
      grid.appendChild(card);
    });
    article.appendChild(grid);
  }

  if (route.docRefs?.length) {
    const sectionTitle = document.createElement('div');
    sectionTitle.className = 'section-title';
    sectionTitle.textContent = 'Связь с документацией';
    article.appendChild(sectionTitle);

    const tags = document.createElement('div');
    tags.className = 'tag-list';
    route.docRefs.forEach((ref) => {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = ref;
      tags.appendChild(tag);
    });
    article.appendChild(tags);
  }

  return article;
}

function renderConnections(route) {
  const wrapper = document.createElement('article');
  wrapper.className = 'route-card';

  const heading = document.createElement('div');
  heading.className = 'section-title';
  heading.textContent = 'Связанная навигация';
  wrapper.appendChild(heading);

  if (route.next?.length) {
    const subtitle = document.createElement('p');
    subtitle.textContent = 'Следующие шаги и соседние разделы:';
    wrapper.appendChild(subtitle);

    const links = document.createElement('div');
    links.className = 'link-list';
    route.next.forEach((path) => {
      if (!routeMap.has(path)) return;
      const link = document.createElement('a');
      link.className = 'link-pill';
      link.href = `#${path}`;
      link.textContent = routeMap.get(path)?.title ?? path;
      link.addEventListener('click', (event) => {
        event.preventDefault();
        navigate(path);
      });
      links.appendChild(link);
    });
    wrapper.appendChild(links);
  } else {
    const empty = document.createElement('div');
    empty.className = 'empty-message';
    empty.textContent = 'Для этого маршрута ещё не задано продолжений.';
    wrapper.appendChild(empty);
  }

  return wrapper;
}

window.addEventListener('hashchange', () => {
  state.currentPath = resolvePath(location.hash);
  render();
});

if (!location.hash) {
  location.hash = state.currentPath;
}

render();
