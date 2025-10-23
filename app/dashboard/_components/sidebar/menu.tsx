import MenuCollapsible from "./menu-collapsible";
import MenuCollapsibleItem from "./menu-collapsible-item";
import MenuItem from "./menu-item";
import { menuList } from "./menu-list";

const SidebarMenu = () => {
  return (
    <nav className="grow space-y-1.5 overflow-y-auto p-6">
      {menuList.map((menu) => {
        if (menu.submenu) {
          return (
            <MenuCollapsible key={menu.id} {...menu}>
              {menu.submenu.map((submenu) => (
                <MenuCollapsibleItem key={submenu.id} {...submenu} />
              ))}
            </MenuCollapsible>
          );
        }

        return <MenuItem key={menu.id} {...menu} />;
      })}
    </nav>
  );
};

export default SidebarMenu;
