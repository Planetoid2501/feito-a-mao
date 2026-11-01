# Feito à Mão — E-commerce Demonstrativo

Landing page estática e responsiva de uma loja fictícia de produtos artesanais, desenvolvida com HTML5 semântico, CSS3 e JavaScript puro (Vanilla JS), com instrumentação de métricas para o Google Analytics 4 (GA4).

## 🚀 Funcionalidades

* **Catálogo Interativo:** Listagem dinâmica de produtos com filtros por categoria (Cerâmica, Decoração, Velas, etc.).
* **Carrinho de Compras (Drawer):** Adição, controle de quantidades, remoção de itens e cálculo automático do total.
* **Persistência no Navegador:** Estado do carrinho mantido entre recargas via `localStorage`.
* **Formulário de Novidades:** Inscrição demonstrativa com validação client-side e feedback visual.
* **Métricas com GA4:** Camada de telemetria preparada para rastrear eventos de navegação e comércio eletrônico.
* **Imagens Locais em WebP:** Imagens otimizadas armazenadas localmente no projeto.
* **Layout Responsivo:** Experiência fluida em dispositivos móveis e desktops.

## 📁 Estrutura de Arquivos

```
feito-a-mao/
├── creditos.html
├── index.html
├── README.md
└── assets/
    ├── css/
    │   └── style.css
    ├── img/
    │   ├── bolsa.webp
    │   ├── cesto.webp
    │   ├── colar.webp
    │   └── vaso.webp
    └── js/
        ├── analytics.js
        └── main.js
```

## 🛠️ Como Testar Localmente

1. Abra o arquivo `index.html` diretamente em seu navegador web.
2. Para uma experiência completa de teste (recomendado para chamadas e scripts de analytics), abra a pasta no **Visual Studio Code** e inicie com a extensão **Live Server**, ou utilize um servidor local:

```bash
# Com Python 3
python -m http.server 8000

# Ou com Node.js
npx serve .
```

## 📊 Eventos Preparados (GA4)

O arquivo `assets/js/analytics.js` disponibiliza o tracking dos seguintes eventos no fluxo da loja:

* `view_item_list` — Visualização da lista de produtos e alteração de filtros.
* `select_content` — Cliques em links de destaque e navegação.
* `add_to_cart` — Adição de um produto à sacola.
* `remove_from_cart` — Remoção de um produto da sacola.
* `view_cart` — Abertura da sacola lateral.
* `begin_checkout` — Início da finalização da compra demonstrativa.
* `purchase` — Conclusão do pedido simulado.
* `sign_up` — Envio demonstrativo do formulário de e-mail.

## ⚠️ Limitações

* **Sem backend:** Não há banco de dados, autenticação ou processamento de pagamento real (ambiente puramente demonstrativo/acadêmico).
* **Produtos fictícios:** Nomes, descrições e preços servem apenas para simulação.
* **Privacidade:** O formulário de newsletter não coleta nem armazena e-mails de verdade.
