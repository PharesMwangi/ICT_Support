import { Route, Routes } from 'react-router-dom';
import { PublicOnly, RequireAdmin, RequireAuth } from './auth/guards.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Tickets from './pages/Tickets.jsx';
import NewTicket from './pages/NewTicket.jsx';
import TicketDetail from './pages/TicketDetail.jsx';
import KbList from './pages/KbList.jsx';
import KbArticle from './pages/KbArticle.jsx';
import KbEditor from './pages/KbEditor.jsx';
import Users from './pages/Users.jsx';
import Reports from './pages/Reports.jsx';
import Notifications from './pages/Notifications.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="tickets/new" element={<NewTicket />} />
          <Route path="tickets/:id" element={<TicketDetail />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="kb" element={<KbList />} />
          <Route path="kb/:id" element={<KbArticle />} />
          <Route element={<RequireAdmin />}>
            <Route path="kb/new" element={<KbEditor />} />
            <Route path="kb/:id/edit" element={<KbEditor />} />
            <Route path="users" element={<Users />} />
            <Route path="reports" element={<Reports />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
