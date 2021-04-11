$(".data-body").on("click","tr", function(){
    var table_wrapper = $(this).parent().parent().parent();
    var table_id = table_wrapper.attr("id");
    var update_popup = $("#add-" + table_id);
    console.log(table_id);
    var modal_body = update_popup.find(".modal-body");
    $(this).children().each(function(){
        // Populate form with table row
        modal_body.find("[name=" + table_id + "-" + $(this).attr("name").replace("_id","") + "]").val($(this).text());
    });
    update_popup.modal("show");
});


// Clear fields on modal close
$('body').on('hidden.bs.modal', function () {
    $(this).find('form').trigger('reset');
})


$(".stock-body").on("click","tr", function(){

});