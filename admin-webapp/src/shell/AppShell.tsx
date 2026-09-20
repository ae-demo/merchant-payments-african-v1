import type { JSX } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  AppShell as OxygenAppShell,
  Divider,
  Footer,
  Header,
  Sidebar,
  UserMenu,
} from "@wso2/oxygen-ui";
import {
  CircleDollarSign,
  LogOut,
  ShieldAlert,
  Store,
  Wallet,
} from "@wso2/oxygen-ui-icons-react";
import { APP_NAME } from "../appName";
import { Can, useHeldRoles, useAuthz } from "../authz/gates";
import { signOut } from "../authz/session";

const NAV_ITEMS = [
  {
    id: "pending-merchants",
    label: "Merchants",
    to: "/merchants",
    icon: <Store />,
    op: "GET /merchants" as const,
    match: (pathname: string) => pathname.startsWith("/merchants"),
  },
  {
    id: "all-transactions",
    label: "Transactions",
    to: "/transactions",
    icon: <CircleDollarSign />,
    op: "GET /transactions" as const,
    match: (pathname: string) => pathname.startsWith("/transactions"),
  },
  {
    id: "all-payouts",
    label: "Payouts",
    to: "/payouts",
    icon: <Wallet />,
    op: "GET /payouts" as const,
    match: (pathname: string) => pathname.startsWith("/payouts"),
  },
  {
    id: "disputes",
    label: "Disputes",
    to: "/disputes",
    icon: <ShieldAlert />,
    op: "GET /disputes" as const,
    match: (pathname: string) => pathname.startsWith("/disputes"),
  },
];

export function AppShell(): JSX.Element {
  const { pathname } = useLocation();
  const { username } = useAuthz();
  const roles = useHeldRoles();
  const active = NAV_ITEMS.find((item) => item.match(pathname))?.id;
  const roleLabel = roles.length > 0 ? roles.join(", ") : undefined;

  return (
    <OxygenAppShell>
      <OxygenAppShell.Navbar>
        <Header>
          <Header.Toggle />
          <Header.Brand>
            <Header.BrandTitle>{APP_NAME}</Header.BrandTitle>
          </Header.Brand>
          <Header.Spacer />
          <Header.Actions>
            <UserMenu>
              <UserMenu.Trigger name={username || "Platform Admin"} />
              <UserMenu.Header name={username || "Platform Admin"} email="" role={roleLabel} />
              <UserMenu.Divider />
              <UserMenu.Logout icon={<LogOut />} onClick={() => void signOut()} />
            </UserMenu>
          </Header.Actions>
        </Header>
      </OxygenAppShell.Navbar>

      <OxygenAppShell.Sidebar>
        <Sidebar activeItem={active}>
          <Sidebar.Nav>
            <Sidebar.Category>
              {NAV_ITEMS.map((item) => (
                <Can key={item.id} op={item.op}>
                  <Sidebar.Item id={item.id} link={<Link to={item.to} />}>
                    <Sidebar.ItemIcon>{item.icon}</Sidebar.ItemIcon>
                    <Sidebar.ItemLabel>{item.label}</Sidebar.ItemLabel>
                  </Sidebar.Item>
                </Can>
              ))}
            </Sidebar.Category>
          </Sidebar.Nav>
        </Sidebar>
      </OxygenAppShell.Sidebar>

      <OxygenAppShell.Main>
        <Outlet />
      </OxygenAppShell.Main>

      <OxygenAppShell.Footer>
        <Footer>
          <Divider sx={{ mb: 1 }} />
          <Footer.Copyright>© WSO2 LLC</Footer.Copyright>
        </Footer>
      </OxygenAppShell.Footer>
    </OxygenAppShell>
  );
}
