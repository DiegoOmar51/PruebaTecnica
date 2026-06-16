frappe.pages['productos-externos'].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Productos Externos',
        single_column: true
    });

    // Cargar HTML
    frappe.render_template('productos_externos', {}, function(html) {
        $(page.body).html(html);
        inicializar_eventos();
        cargar_productos('https://dummyjson.com/products');
    });
};

function inicializar_eventos() {
    $('#btn-buscar').on('click', function() {
        var texto = $('#search-input').val().trim();
        if (texto) {
            cargar_productos(
                'https://dummyjson.com/products/search?q=' + 
                encodeURIComponent(texto)
            );
        }
    });

    $('#search-input').on('keypress', function(e) {
        if (e.which === 13) $('#btn-buscar').click();
    });

    $('#btn-todos').on('click', function() {
        $('#search-input').val('');
        cargar_productos('https://dummyjson.com/products');
    });
}

function cargar_productos(url) {
    $('#loading').show();
    $('#productos-table').hide();
    $('#productos-body').empty();

    fetch(url)
        .then(response => response.json())
        .then(data => {
            var productos = data.products || [];
            var productos_ids = productos.map(p => p.id);

            // Consultar cuáles ya están importados
            frappe.call({
                method: 'prueba_api.api.obtener_importados',
                args: { product_ids: JSON.stringify(productos_ids) },
                callback: function(r) {
                    var importados = r.message || [];
                    render_tabla(productos, importados);
                    $('#loading').hide();
                    $('#productos-table').show();
                },
                error: function() {
                    $('#loading').hide();
                    $('#productos-table').show();
                    render_tabla(productos, []);
                }
            });
        })
        .catch(err => {
            $('#loading').hide();
            frappe.throw('Error al cargar productos: ' + err.message);
        });
}

function render_tabla(productos, importados) {
    var tbody = $('#productos-body');
    tbody.empty();

    if (productos.length === 0) {
        tbody.append('<tr><td colspan="6" class="text-center">Sin resultados</td></tr>');
        return;
    }

    productos.forEach(function(p) {
        var ya_importado = importados.includes(p.id);
        var row_class = ya_importado ? 'table-success' : '';
        var btn_text = ya_importado ? '✓ Importado' : 'Importar';
        var btn_disabled = ya_importado ? 'disabled' : '';
        var btn_class = ya_importado 
            ? 'btn btn-secondary btn-sm' 
            : 'btn btn-primary btn-sm';

        // Escapar comillas para pasar por onclick
        var safe_title = p.title.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        var safe_desc = (p.description || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        var safe_cat = (p.category || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        var safe_thumb = (p.thumbnail || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');

        var row = `
            <tr class="${row_class}" data-product-id="${p.id}">
                <td>
                    <img src="${p.thumbnail}" alt="${safe_title}" 
                         style="width:50px;height:50px;object-fit:cover;border-radius:4px;">
                </td>
                <td><strong>${safe_title}</strong></td>
                <td>${safe_cat}</td>
                <td>$${p.price}</td>
                <td>${p.stock}</td>
                <td>
                    <button class="${btn_class}" ${btn_disabled}
                            data-id="${p.id}"
                            data-title="${safe_title}"
                            data-price="${p.price}"
                            data-desc="${safe_desc}"
                            data-cat="${safe_cat}"
                            data-stock="${p.stock}"
                            data-thumb="${safe_thumb}">
                        ${btn_text}
                    </button>
                </td>
            </tr>
        `;
        tbody.append(row);
    });

    // Bind click en botones Importar
    $('#productos-body button.btn-primary').on('click', function() {
        var btn = $(this);
        importar_producto(
            btn.data('id'),
            btn.data('title'),
            btn.data('price'),
            btn.data('desc'),
            btn.data('cat'),
            btn.data('stock'),
            btn.data('thumb')
        );
    });
}

function importar_producto(product_id, title, price, description, category, stock, thumbnail) {
    frappe.call({
        method: 'prueba_api.api.importar_producto',
        args: {
            product_id: product_id,
            title: title,
            price: price,
            description: description,
            category: category,
            stock: stock,
            thumbnail: thumbnail
        },
        freeze: true,
        freeze_message: 'Importando producto...',
        callback: function(r) {
            if (r.message) {
                if (r.message.status === 'ok') {
                    frappe.show_alert({
                        message: 'Producto importado correctamente',
                        indicator: 'green'
                    }, 3);
                    marcar_fila_importada(product_id);
                } else if (r.message.status === 'duplicado') {
                    frappe.show_alert({
                        message: 'Este producto ya fue importado',
                        indicator: 'orange'
                    }, 3);
                    marcar_fila_importada(product_id);
                }
            }
        },
        error: function() {
            frappe.throw('Error al importar el producto');
        }
    });
}

function marcar_fila_importada(product_id) {
    var row = $(`tr[data-product-id="${product_id}"]`);
    row.addClass('table-success');
    var btn = row.find('button');
    btn.text('✓ Importado')
       .prop('disabled', true)
       .removeClass('btn-primary')
       .addClass('btn-secondary');
}