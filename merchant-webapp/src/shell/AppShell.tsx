// The signed-in app shell — the sample app's structure (AppShell.Navbar +
// AppShell.Sidebar + AppShell.Main + AppShell.Footer), matching every
// wireframe screen's `navbar "Merchant Payments"` + `sidebar "..."` pair.
// ONE rail, wrapped item by item in <Can>, so a caller holding a partial
// grant set sees exactly the union the wireframes draw one role at a time.
import type { JSX } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  AppShell as OxygenAppShell,
  Header,
  Sidebar,
  Footer,
  UserMenu,
  ColorSchemeToggle,
  Divider,
} from "@wso2/oxygen-ui";
import {
  LayoutDashboard,
  Receipt,
  History,
  Wallet,
  Landmark,
  LogOut,
} from "@wso2/oxygen-ui-icons-react";
import { APP_NAME } from "../appName";
import { Can, useAuthz, useHeldRoles } from "../authz/gates";
import { signOut } from "../authz/session";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard />, op: "GET /me/balance" },
  {
    id: "paymentrequests",
    label: "Payment Requests",
    path: "/payment-requests",
    icon: <Receipt />,
    op: "GET /me/payment-requests",
  },
  {
    id: "transactions",
    label: "Transactions",
    path: "/transactions",
    icon: <History />,
    op: "GET /me/transactions",
  },
  { id: "payouts", label: "Payouts", path: "/payouts", icon: <Wallet />, op: "GET /me/payouts" },
  {
    id: "payoutaccount",
    label: "Payout Account",
    path: "/payout-account",
    icon: <Landmark />,
    op: "GET /me/payout-account",
  },
] as const;

function activeItemFor(pathname: string): string {
  const match = NAV_ITEMS.find((item) => pathname.startsWith(item.path));
  return match?.id ?? "";
}

export function AppShell(): JSX.Element {
  const { pathname } = useLocation();
  const { username } = useAuthz();
  const roles = useHeldRoles();

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
            <ColorSchemeToggle />
            <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
            <UserMenu>
              <UserMenu.Trigger name={username || "Merchant"} />
              <UserMenu.Header
                name={username || "Merchant"}
                email={username}
                role={roles.join(", ") || undefined}
              />
              <UserMenu.Logout icon={<LogOut />} onClick={() => void signOut()} />
            </UserMenu>
          </Header.Actions>
        </Header>
      </OxygenAppShell.Navbar>

      <OxygenAppShell.Sidebar>
        <Sidebar activeItem={activeItemFor(pathname)}>
          <Sidebar.Nav>
            <Sidebar.Category>
              {NAV_ITEMS.map((item) => (
                <Can key={item.id} op={item.op}>
                  <Sidebar.Item id={item.id} link={<Link to={item.path} />}>
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
          <Footer.Copyright>© WSO2 LLC</Footer.Copyright>
        </Footer>
      </OxygenAppShell.Footer>
    </OxygenAppShell>
  );
}
