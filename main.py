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
from kivymd.uix.button import MDFillRoundFlatButton
from kivymd.uix.gridlayout import MDGridLayout
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
    
    # Cart/Orders could go here
    
    # Sample Products if empty
    cursor.execute("SELECT COUNT(*) FROM products")
    if cursor.fetchone()[0] == 0:
        samples = [
            ("iPhone 14 Pro", 74999, "Elektronik", "En yeni iPhone modeli."),
            ("MacBook Air M2", 42000, "Bilgisayar", "Hafif ve güçlü."),
            ("Sony Kulaklık", 4500, "Ses", "Gürültü engelleyici."),
            ("Logitech Mouse", 800, "Aksesuar", "Kablosuz mouse."),
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
        self.elevation = 4

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
            text=desc, 
            halign="center", 
            font_style="Caption",
            theme_text_color="Hint",
            size_hint_y=None,
            height=dp(40)
        ))
        
        self.add_widget(MDFillRoundFlatButton(
            text="Sepete Ekle",
            pos_hint={"center_x": 0.5},
            size_hint_y=None,
            height=dp(30)
        ))

class HomeScreen(MDScreen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.build_ui()
        
    def build_ui(self):
        layout = MDBoxLayout(orientation='vertical')
        
        toolbar = MDTopAppBar(
            title="Mobil Market (Offline)",
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
        
        # Load from DB
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

class MobilMarketApp(MDApp):
    def build(self):
        self.theme_cls.primary_palette = "Blue"
        self.theme_cls.theme_style = "Dark"
        
        init_db()  # Initialize DB on startup
        
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
        screen_cart.add_widget(MDLabel(text="Sepet Özelliği Yakında", halign="center"))
        nav.add_widget(screen_cart)
        
        return nav

if __name__ == '__main__':
    MobilMarketApp().run()
