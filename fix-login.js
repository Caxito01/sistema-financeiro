const fs = require('fs');

const OLD_LINK = '<a href="login.html">🔐 Login</a>';
const NEW_LINK = '<a href="#" onclick="handleLogout();return false;">🔐 Sair</a>';

// Pages that already have handleLogout()
const pages = ['lancamentos.html','lista-lancamentos.html','relatorios.html','cartao-credito.html'];
pages.forEach(f => {
  const path = 'html_version/' + f;
  let c = fs.readFileSync(path, 'utf8');
  const count = (c.split(OLD_LINK).length - 1);
  if (count > 0) {
    c = c.split(OLD_LINK).join(NEW_LINK);
    fs.writeFileSync(path, c, 'utf8');
    console.log(f + ': OK (' + count + ' replaced)');
  } else {
    console.log(f + ': MISS - link not found');
  }
});

// dashboard.html — no Supabase currently, add config script + handleLogout
const dash = 'html_version/dashboard.html';
let d = fs.readFileSync(dash, 'utf8');

// 1. Add Supabase CDN + config script before </head>
if (!d.includes('supabase-config.js')) {
  d = d.replace(
    '</head>',
    '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>\n<script src="config/supabase-config.js"></script>\n</head>'
  );
  console.log('dashboard.html: added supabase scripts');
}

// 2. Add handleLogout() before </script> of the first script block with DOMContentLoaded
const logoutFn = `
    async function handleLogout() {
      try {
        await logout();
        window.location.href = 'login.html';
      } catch (e) {
        window.location.href = 'login.html';
      }
    }
`;
if (!d.includes('handleLogout')) {
  // Insert before the closing </script> tag (last one before </body>)
  const lastScriptClose = d.lastIndexOf('</script>');
  d = d.slice(0, lastScriptClose) + logoutFn + '\n' + d.slice(lastScriptClose);
  console.log('dashboard.html: added handleLogout()');
}

// 3. Fix login link
if (d.includes(OLD_LINK)) {
  d = d.split(OLD_LINK).join(NEW_LINK);
  console.log('dashboard.html: login link updated');
} else {
  console.log('dashboard.html: MISS login link');
}

fs.writeFileSync(dash, d, 'utf8');

// Also fix portal.html if it has the same plain login link
try {
  let p = fs.readFileSync('html_version/portal.html', 'utf8');
  if (p.includes('<a href="login.html">')) {
    p = p.replace(/<a href="login\.html"[^>]*>.*?<\/a>/g, (m) => {
      if (m.includes('Login') || m.includes('login')) {
        return '<a href="#" onclick="handleLogout();return false;">🔐 Sair</a>';
      }
      return m;
    });
    fs.writeFileSync('html_version/portal.html', p, 'utf8');
    console.log('portal.html: login link updated');
  }
} catch(e) {}

console.log('\nDone.');
