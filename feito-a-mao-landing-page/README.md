# Feito à Mão — e-commerce demonstrativo

Landing page estática de uma loja fictícia de produtos artesanais, feita com HTML, CSS e JavaScript.

## Funcionalidades
- Catálogo de produtos e filtros por categoria.
- Carrinho com quantidades, remoção e cálculo do total.
- Carrinho persistido no navegador via `localStorage`.
- Formulário demonstrativo de novidades.
- Layout responsivo.
- Eventos preparados para Google Analytics 4 (GA4).
- Pedido de teste sem pagamento real.

## Estrutura de arquivos
```text
feito-a-mao/
├── index.html
├── README.md
└── assets/
    ├── css/
    │   └── style.css
    └── js/
        ├── analytics.js
        └── main.js
```

## Testar localmente
Abra `index.html` no navegador. Para testes mais fiéis, use a extensão Live Server no Visual Studio Code ou execute um servidor local.

## Eventos preparados
- `view_item_list`
- `select_content`
- `add_to_cart`
- `remove_from_cart`
- `view_cart`
- `begin_checkout`
- `purchase` (somente pedido simulado)
- `sign_up` (envio demonstrativo do formulário)

## Limitações
- Não há backend, banco de dados, autenticação ou pagamento real.
- Produtos e preços são fictícios.
- O formulário não envia nem armazena e-mails.
- As imagens de demonstração são carregadas de URLs externas; é necessária conexão com a internet para visualizá-las.