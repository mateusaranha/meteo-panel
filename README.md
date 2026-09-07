# MeteoPanel — protótipo

Painel meteorológico estático para consultar **Windy**, **Windguru** e **Open-Meteo** na mesma página.

## Objetivo do protótipo

- zero backend;
- zero banco de dados;
- sem framework;
- compatível com GitHub Pages;
- configuração dos locais concentrada em `config.js`;
- layout responsivo para desktop e celular;
- cada fonte continua responsável pelos próprios dados.

O local inicial configurado é **Florianópolis, SC**.

## Fontes

- **Windy**: mapa meteorológico interativo;
- **Windguru**: tabela técnica de vento, rajadas e modelos;
- **Open-Meteo**: condições atuais e previsão resumida dos próximos dias.

## Estrutura

```text
index.html
styles.css
config.js
app.js
README.md
```

## Rodar localmente

Por usar conteúdo e dados externos, é melhor servir os arquivos por HTTP em vez de abrir `index.html` diretamente pelo Explorador de Arquivos.

Com Python instalado:

```bash
python -m http.server 8080
```

Depois abra:

```text
http://localhost:8080
```

## Publicar no GitHub Pages

1. Em **Settings → Pages**, escolha a branch principal e a pasta `/ (root)`.
2. Salve.

Não há etapa de build.

## Configuração

Os dados do local ficam em `config.js`:

- coordenadas usadas pelo Windy e Open-Meteo;
- ID do spot no Windguru.

O protótipo usa o spot `105160` do Windguru para Florianópolis.

## Open-Meteo

O painel consulta diretamente a API pública do Open-Meteo no navegador e mostra:

- temperatura atual;
- sensação térmica;
- condição meteorológica;
- vento e rajadas;
- precipitação atual;
- máxima e mínima dos próximos 5 dias;
- probabilidade e acumulado diário de precipitação.

A atribuição ao Open-Meteo é exibida no próprio painel.

## Próximos passos sugeridos

- testar o card do Open-Meteo em desktop e celular;
- ajustar a hierarquia visual com base no uso real;
- adicionar seletor de locais;
- salvar local favorito em `localStorage`;
- avaliar uma previsão horária compacta;
- adicionar PWA apenas se fizer sentido.
