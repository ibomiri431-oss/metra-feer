import os
import sqlite3
from kivymd.app import MDApp
from kivymd.uix.screen import MDScreen
from kivymd.uix.screenmanager import MDScreenManager
from kivymd.uix.toolbar import MDTopAppBar
from kivymd.uix.bottomnavigation import MDBottomNavigation, MDBottomNavigationItem
from kivymd.uix.label import MDLabel
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.scrollview import MDScrollView
from kivymd.uix.card import MDCard
from kivymd.uix.button import MDFillRoundFlatButton, MDIconButton
from kivymd.uix.list import MDList, TwoLineAvatarIconListItem, ImageLeftWidget, IconRightWidget
from kivymd.uix.dialog import MDDialog
from kivymd.uix.gridlayout import MDGridLayout
from kivymd.toast import toast
from kivy.metrics import dp
from kivy.core.window import Window

# Set window size for testing on desktop
Window.size = (400, 750)
DB_NAME = "mobil_market.db"

def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Products Table
    cursor.execute('''CREATE TABLE IF NOT EXISTS products (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        price REAL NOT NULL,
                        category TEXT,
                        description TEXT)''')
    
    # Cart Table
    cursor.execute('''CREATE TABLE IF NOT EXISTS cart (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        product_name TEXT NOT NULL,
                        price REAL NOT NULL)''')
    
    # Sample Products if empty
    cursor.execute("SELECT COUNT(*) FROM products")
    if cursor.fetchone()[0] == 0:
        samples = [
            ("iPhone 14 Pro", 74999, "Elektronik", "En yeni iPhone modeli."),
            ("MacBook Air M2", 42000, "Bilgisayar", "Hafif ve güçlü."),
            ("Sony Kulaklık", 4500, "Ses", "Gürültü engelleyici."),
            ("Logitech Mouse", 800, "Aksesuar", "Kablosuz mouse."),
            ("Samsung S23", 65000, "Elektronik", "Android amiral gemisi."),
            ("iPad Pro", 35000, "Tablet", "M2 çip ile güçlendirilmiş."),
        ]
        cursor.executemany("INSERT INTO products (name, price, category, description) VALUES (?,?,?,?)", samples)
        conn.commit()
    
    conn.close()

class ProductCard(MDCard):
    def __init__(self, name, price, desc, **kwargs):
        super().__init__(**kwargs)
        self.orientation = "vertical"
        self.size_hint = (None, None)
        self.size = (dp(160), dp(220))
        self.padding = dp(10)
        self.spacing = dp(5)
        self.radius = [15]
        self.elevation = 3
        
        self.product_name = name
        self.product_price = price

        self.add_widget(MDLabel(
            text="📦", 
            halign="center", 
            font_style="H2",
            size_hint_y=0.4
        ))
        
        self.add_widget(MDLabel(
            text=name, 
            halign="center", 
            bold=True,
            theme_text_color="Primary",
            size_hint_y=None,
            height=dp(20)
        ))
        
        self.add_widget(MDLabel(
            text=f"{price} TL", 
            halign="center", 
            theme_text_color="Secondary",
            size_hint_y=None,
            height=dp(20)
        ))
        
        self.add_widget(MDLabel(
            text=desc[:20] + "..." if len(desc) > 20 else desc, 
            halign="center", 
            font_style="Caption",
            theme_text_color="Hint",
            size_hint_y=None,
            height=dp(30)
        ))
        
        btn = MDFillRoundFlatButton(
            text="Sepete Ekle",
            pos_hint={"center_x": 0.5},
            size_hint_y=None,
            height=dp(30)
        )
        btn.bind(on_release=self.add_to_cart)
        self.add_widget(btn)

    def add_to_cart(self, instance):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO cart (product_name, price) VALUES (?, ?)", (self.product_name, self.product_price))
        conn.commit()
        conn.close()
        toast(f"{self.product_name} sepete eklendi!")

class CartScreen(MDScreen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Built in on_enter
    
    def on_enter(self):
        self.build_ui()

    def build_ui(self):
        self.clear_widgets()
        layout = MDBoxLayout(orientation='vertical')
        
        toolbar = MDTopAppBar(
            title="Sepetim",
            elevation=4,
            pos_hint={"top": 1},
            md_bg_color=(0.1, 0.1, 0.1, 1),
            specific_text_color=(1, 1, 1, 1)
        )
        layout.add_widget(toolbar)
        
        scroll = MDScrollView()
        list_container = MDList()
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM cart")
        items = cursor.fetchall()
        
        total_price = 0
        
        if not items:
            list_container.add_widget(MDLabel(
                text="\n\nSepetiniz boş.", 
                halign="center",
                theme_text_color="Hint"
            ))
        else:
            for item in items:
                total_price += item['price']
                
                list_item = TwoLineAvatarIconListItem(
                    text=item['product_name'],
                    secondary_text=f"{item['price']} TL"
                )
                list_item.add_widget(ImageLeftWidget(source="")) # Placeholder for icon
                
                del_btn = IconRightWidget(icon="trash-can")
                del_btn.bind(on_release=lambda x, i=item['id']: self.remove_item(i))
                list_item.add_widget(del_btn)
                
                list_container.add_widget(list_item)
        
        conn.close()
        scroll.add_widget(list_container)
        layout.add_widget(scroll)
        
        # Summary Area
        summary = MDBoxLayout(
            orientation="horizontal", 
            size_hint_y=None, 
            height=dp(60),
            padding=dp(20),
            md_bg_color=(0.2, 0.2, 0.2, 1)
        )
        summary.add_widget(MDLabel(
            text=f"Toplam: {total_price} TL",
            bold=True,
            theme_text_color="Custom",
            text_color=(1, 1, 1, 1)
        ))
        pay_btn = MDFillRoundFlatButton(
            text="Siparişi Tamamla"
        )
        pay_btn.bind(on_release=self.checkout)
        summary.add_widget(pay_btn)
        
        layout.add_widget(summary)
        self.add_widget(layout)
        
    def remove_item(self, item_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM cart WHERE id = ?", (item_id,))
        conn.commit()
        conn.close()
        self.build_ui()
        toast("Ürün silindi")

    def checkout(self, instance):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM cart")
        conn.commit()
        conn.close()
        self.build_ui()
        
        self.dialog = MDDialog(
            title="Sipariş Alındı",
            text="Siparişiniz başarıyla oluşturuldu! (Simülasyon)",
            buttons=[
                MDFillRoundFlatButton(
                    text="TAMAM",
                    on_release=lambda x: self.dialog.dismiss()
                )
            ],
        )
        self.dialog.open()

class HomeScreen(MDScreen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.build_ui()
        
    def build_ui(self):
        layout = MDBoxLayout(orientation='vertical')
        
        toolbar = MDTopAppBar(
            title="Mobil Market",
            elevation=4,
            pos_hint={"top": 1},
            md_bg_color=(0.1, 0.1, 0.1, 1),
            specific_text_color=(1, 1, 1, 1)
        )
        layout.add_widget(toolbar)
        
        scroll = MDScrollView()
        grid = MDGridLayout(
            cols=2, 
            spacing=dp(15), 
            padding=dp(15), 
            size_hint_y=None,
            adaptive_height=True
        )
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM products")
        products = cursor.fetchall()
        conn.close()
        
        for p in products:
            grid.add_widget(ProductCard(name=p['name'], price=p['price'], desc=p['description']))
            
        scroll.add_widget(grid)
        layout.add_widget(scroll)
        
        self.add_widget(layout)

class ProfileScreen(MDScreen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        layout = MDBoxLayout(orientation='vertical', padding=dp(20), spacing=dp(20))
        
        layout.add_widget(MDLabel(
            text="Profil", 
            halign="center", 
            font_style="H4"
        ))
        
        layout.add_widget(MDLabel(
            text="Kullanıcı: Misafir", 
            halign="center"
        ))
        
        layout.add_widget(MDFillRoundFlatButton(
            text="Giriş Yap / Kayıt Ol",
            pos_hint={"center_x": 0.5}
        ))
        
        layout.add_widget(MDLabel())
        self.add_widget(layout)

class MobilMarketApp(MDApp):
    def build(self):
        self.theme_cls.primary_palette = "DeepPurple"
        self.theme_cls.theme_style = "Dark"
        
        init_db()
        
        nav = MDBottomNavigation(
            panel_color=(0.15, 0.15, 0.15, 1),
            selected_color_background=(0, 0, 0, 0),
            text_color_active=(1, 1, 1, 1),
        )
        
        screen_home = MDBottomNavigationItem(
            name='home',
            text='Mağaza',
            icon='store',
        )
        screen_home.add_widget(HomeScreen())
        nav.add_widget(screen_home)
        
        screen_cart = MDBottomNavigationItem(
            name='cart',
            text='Sepet',
            icon='cart',
        )
        screen_cart.add_widget(CartScreen())
        nav.add_widget(screen_cart)
        
        screen_profile = MDBottomNavigationItem(
            name='profile',
            text='Profil',
            icon='account',
        )
        screen_profile.add_widget(ProfileScreen())
        nav.add_widget(screen_profile)
        
        return nav

if __name__ == '__main__':
    MobilMarketApp().run()
