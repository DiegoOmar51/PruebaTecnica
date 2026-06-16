import frappe
from frappe import _


@frappe.whitelist()
def importar_producto(product_id, title, price, description, category, stock, thumbnail):
    """
    Importa un producto desde dummyjson.com a la DocType 'Producto Externo'.
    Retorna {"status": "ok"} o {"status": "duplicado"}.
    """
    # Verificar si ya existe
    existente = frappe.db.exists("Producto Externo", {"product_id": product_id})

    if existente:
        return {"status": "duplicado"}

    # Crear el documento
    doc = frappe.get_doc({
        "doctype": "Producto Externo",
        "product_id": product_id,
        "title": title,
        "price": price,
        "description": description,
        "category": category,
        "stock": stock,
        "thumbnail": thumbnail
    })
    doc.insert(ignore_permissions=True)
    frappe.db.commit()

    return {"status": "ok"}


@frappe.whitelist()
def obtener_importados(product_ids):
    """
    Recibe una lista de IDs (JSON string) y retorna los que ya están importados.
    """
    import json

    if isinstance(product_ids, str):
        product_ids = json.loads(product_ids)

    if not product_ids:
        return []

    existentes = frappe.get_all(
        "Producto Externo",
        filters={"product_id": ["in", product_ids]},
        pluck="product_id"
    )

    # Normalizar a int para comparar con los IDs de dummyjson
    return [int(pid) for pid in existentes]