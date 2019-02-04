if (window.digitalData) {
  if (digitalData.transaction) {
    var i, j;
    b.product_id = [];
    b.product_price = [];
    b.product_name = [];
    //b.primary_product_id = [];  // captures the value of all product ids (copy of product_id) on primary order

    var itemCount = digitalData.transaction.item.length;
    var transactionTotalObj = digitalData.transaction.total;
    b.order_shipping_cost = transactionTotalObj.shipping;
    b.order_booking_slot_cost = transactionTotalObj.slotCost;
    b.order_shipping_method = transactionTotalObj.shippingMethod == "delivery" ? "delivery" : "collect";
    b.voucher_discount = Number(transactionTotalObj.voucherDiscount[0] || "0");
    b.voucher_code = transactionTotalObj.voucherCode;
    b.product_total = 0;

    if (!digitalData.transaction.amendOrderId) {
      b.product_quantity = [];
      b.page_event = b.page_name_identifier;
      b.order_id = digitalData.transaction.orderId;
      for (i = 0; i < itemCount; i++) {
        var itemInst = digitalData.transaction.item[i];
        b.product_id.push(itemInst.productInfo.productId);
        b.product_price.push(itemInst.altPrice);
        b.product_name.push(itemInst.productInfo.productName);

        if (itemInst.productInfo.weightRange) {
          b.product_quantity.push(1);
        } else {
          b.product_quantity.push(itemInst.quantity || itemInst.altQuantity);
        }
        b.product_total += (itemInst.quantity || itemInst.altQuantity) * 1;
      }

      b.primary_product_id = b.product_id;
      b.trolley_savings = Math.abs(transactionTotalObj.trolleySavings);
      b.total_discount = b.voucher_discount + b.trolley_savings;
      b.order_total = transactionTotalObj.transactionTotal;
      b.order_base_revenue = transactionTotalObj.basePrice;
      b.order_base_price = transactionTotalObj.priceWithTax;

    } else {
      b.amended_order_id = digitalData.transaction.orderId;
      b.order_amend_total = transactionTotalObj.transactionTotal;
      b.trolley_savings = Math.abs(transactionTotalObj.trolleySavings);
      b.total_discount = b.voucher_discount + b.trolley_savings;
      b.page_event = "order amend confirm";
      b.amended_product_id = []; // added for Heineken tag as we don't want to pass any product id when there's a decrease or product removed - Anthony E.
      b.product_amend_increment_quantity = [];
      b.product_amend_increment_value = [];
      b.product_amend_decrement_quantity = [];
      b.product_amend_decrement_value = [];
      b.clean_amended_increment_value = [];
      b.clean_amended_increment_quantity = [];

      var orderCompare = {
        "item": []
      };
      var lsPreviousOrder = window.localStorage.getItem('previous_order');
      if (lsPreviousOrder) {
        orderCompare = JSON.parse(lsPreviousOrder);
      } else if (b["cp.previous_order"]) {
        orderCompare = JSON.parse(b["cp.previous_order"]);
      }

      var previousItemCount = orderCompare.item.length;
      var amendOrder = {};
      var productUnitTotal = 0;

      if (previousItemCount == 0) {
        b.page_secondary_event = "nosessionstorage";
      }

      for (i = 0; i < itemCount; i++) {
        var itemInst = digitalData.transaction.item[i];

        if (itemInst.quantity) {
          productUnitTotal += itemInst.quantity * 1;
        } else {
          productUnitTotal++;
        }
      }

      b.order_amend_units = productUnitTotal;

      for (i = 0; i < previousItemCount; i++) {
        var currentItemInst;
        var deletedInst = orderCompare.item[i];
        var deletedProduct = true;

        for (j = 0; j < itemCount; j++) {
          currentItemInst = digitalData.transaction.item[j];

          if (currentItemInst.productInfo.productId == deletedInst.productId) {
            deletedProduct = false;
          }
        }

        if (deletedProduct) {
          b.product_id.push(deletedInst.productId);
          b.product_amend_increment_quantity.push("");
          b.product_amend_decrement_quantity.push(deletedInst.quantity || 1);
          b.product_amend_increment_value.push("");
          b.product_amend_decrement_value.push(Number(deletedInst.price).toFixed(2));
        }
      }

      for (i = 0; i < itemCount; i++) {
        var previousInst;
        var itemInst = digitalData.transaction.item[i];

        for (j = 0; j < previousItemCount; j++) {
          var prevItemInst = orderCompare.item[j];

          if (itemInst.productInfo.productId == prevItemInst.productId) {
            previousInst = prevItemInst;
            break;
          }
        }

        if (previousInst) {
          if (itemInst.quantity) {
            var itemQuan = Number(itemInst.quantity);
            var itemPrice = Number(itemInst.price);
            var prevQuan = Number(previousInst.quantity || 1);
            var prevPrice = Number(previousInst.price);

            if (itemQuan != prevQuan) {
              if (itemQuan > prevQuan) {
                b.product_amend_increment_quantity.push(Math.abs(itemQuan - prevQuan));
                b.product_amend_decrement_quantity.push("");
                b.product_amend_increment_value.push(Number(Math.abs(itemPrice - prevPrice)).toFixed(2));
                b.product_amend_decrement_value.push("");
                b.amended_product_id.push(itemInst.productInfo.productId); // For Heineken tag on product increment
                b.clean_amended_increment_value.push(Number(Math.abs(itemPrice - prevPrice)).toFixed(2));
                b.clean_amended_increment_quantity.push(Math.abs(itemQuan - prevQuan));
              } else {
                b.product_amend_increment_quantity.push("");
                b.product_amend_decrement_quantity.push(Math.abs(prevQuan - itemQuan));
                b.product_amend_increment_value.push("");
                b.product_amend_decrement_value.push(Number(Math.abs(prevPrice - itemPrice)).toFixed(2));

              }

              b.product_id.push(itemInst.productInfo.productId);
              //b.product_price.push(itemInst.altPrice);

              /*if (itemInst.productInfo.quantityType == previousInst.quantityType) {
                b.product_quantity.push(itemInst.quantity - (previousInst.quantity || 1));
              }
              else {
                  b.product_quantity.push(itemInst.quantity);
              }*/
            }
          } else if (itemInst.productInfo.weight !== previousInst.weight) {
            if (itemInst.productInfo.weight * 1 > previousInst.weight * 1) {
              b.product_amend_increment_quantity.push(1);
              b.product_amend_decrement_quantity.push("");
              b.product_amend_increment_value.push(Number(Math.abs(Number(itemInst.price) - Number(previousInst.price))).toFixed(2));
              b.product_amend_decrement_value.push("");
              b.amended_product_id.push(itemInst.productInfo.productId); // for Heineken tag on increase by weight
              b.clean_amended_increment_value.push(Number(Math.abs(Number(itemInst.price) - Number(previousInst.price))).toFixed(2));
              b.clean_amended_increment_quantity.push(1);
            } else {
              b.product_amend_increment_quantity.push("");
              b.product_amend_decrement_quantity.push(1);
              b.product_amend_increment_value.push("");
              b.product_amend_decrement_value.push(Number(Math.abs(Number(previousInst.price) - Number(itemInst.price))).toFixed(2));
            }

            b.product_id.push(itemInst.productInfo.productId);
          }
        } else if (previousItemCount) {
          b.product_amend_increment_quantity.push(itemInst.quantity || itemInst.altQuantity);
          b.product_amend_decrement_quantity.push("");
          b.product_amend_increment_value.push(Number((itemInst.quantity || itemInst.altQuantity) * itemInst.altPrice).toFixed(2));
          b.product_amend_decrement_value.push("");
          b.product_id.push(itemInst.productInfo.productId);
          b.amended_product_id.push(itemInst.productInfo.productId); // For Heineken tag - product added
          b.clean_amended_increment_value.push(Number((itemInst.quantity || itemInst.altQuantity) * itemInst.altPrice).toFixed(2));
          b.clean_amended_increment_quantity.push(itemInst.quantity || itemInst.altQuantity);
          //b.product_price.push(itemInst.altPrice);
          //b.product_quantity.push((itemInst.quantity || itemInst.altQuantity));
        }
      }

      b.order_amend = "false";
      window.localStorage.removeItem('previous_order');
    }

    if (digitalData.transaction.profile && digitalData.transaction.profile.profileInfo) {
      if (digitalData.transaction.profile.profileInfo.firstOrder == 'Yes') {
        b.first_order_ref = 'New';
      } else if (digitalData.transaction.profile.profileInfo.firstOrder == 'No') {
        b.first_order_ref = 'Existing';
      }
    }
    var orderUserProfile;
    if (digitalData.user && digitalData.user.profile && digitalData.user.profile.profileInfo) {
      orderUserProfile = digitalData.user.profile.profileInfo;
      b.order_delivery_slot = orderUserProfile.deliverySlot;
      b.order_delivery_storeid = orderUserProfile.deliveryStoreId.replace(/C/g, '');
      b.delivery_location = orderUserProfile.deliveryPostcode;
      b.delivery_option = orderUserProfile.deliveryOption;
      b.same_day_delivery = orderUserProfile.isSameDay;

      var slotDetails = b.order_delivery_slot.split(" ");
      b.order_delivery_day = slotDetails[0];
      b.order_delivery_slottime = slotDetails[4];
      b.order_delivery_postcode = digitalData.user.profile.profileInfo.deliveryPostcode.substring(0, digitalData.user.profile.profileInfo.deliveryPostcode.indexOf(' ') + 2);

      var currentDate = new Date(digitalData.page.pageInfo.userTimestamp);
      // var deliveryDate = new Date(b.order_delivery_slot.split('-')[0] + currentDate.getFullYear());

      // converting the delivery time format to a reusable format
      var deliveryTimeValue = (function() {

      var deliverySlotArr = digitalData.user.profile.profileInfo.deliverySlot.split(" ");
      var wrongFormatHour = deliverySlotArr[deliverySlotArr.length - 1];
      var wrongFormatHourArr = wrongFormatHour.split("-");

      var deliveryTimeHour = wrongFormatHourArr[0];
          switch (deliveryTimeHour.toLowerCase()) {
                                case "7am":
                                    deliveryTimeHour = "07:00";
                                    break;
                                case "7:30am":
                                    deliveryTimeHour = "07:30";
                                    break;
                                case "8am":
                                    deliveryTimeHour = "08:00";
                                    break;
                                case "8:30am":
                                    deliveryTimeHour = "08:30";
                                    break;
                                case "9am":
                                    deliveryTimeHour = "09:00";
                                    break;
                                case "9:30am":
                                    deliveryTimeHour = "09:30";
                                    break;
                                case "10am":
                                    deliveryTimeHour = "10:00";
                                    break;
                                case "10:30am":
                                    deliveryTimeHour = "10:30";
                                    break;
                                case "11am":
                                    deliveryTimeHour = "11:00";
                                    break;
                                case "11:30am":
                                    deliveryTimeHour = "11:30";
                                    break;
                                case "12pm":
                                    deliveryTimeHour = "12:00";
                                    break;
                                case "12:30pm":
                                    deliveryTimeHour = "12:30";
                                    break;
                                case "1pm":
                                    deliveryTimeHour = "13:00";
                                    break;
                                case "1:30pm":
                                    deliveryTimeHour = "13:30";
                                    break;
                                case "2pm":
                                    deliveryTimeHour = "14:00";
                                    break;
                                case "2:30pm":
                                    deliveryTimeHour = "14:30";
                                    break;
                                case "3pm":
                                    deliveryTimeHour = "15:00";
                                    break;
                                case "3:30pm":
                                    deliveryTimeHour = "15:30";
                                    break;
                                case "4pm":
                                    deliveryTimeHour = "16:00";
                                    break;
                                case "4:30pm":
                                    deliveryTimeHour = "16:30";
                                    break;
                                case "5pm":
                                    deliveryTimeHour = "17:00";
                                    break;
                                case "5:30pm":
                                    deliveryTimeHour = "17:30";
                                    break;
                                case "6pm":
                                    deliveryTimeHour = "18:00";
                                    break;
                                case "6:30pm":
                                    deliveryTimeHour = "18:30";
                                    break;
                                case "7pm":
                                    deliveryTimeHour = "19:00";
                                    break;
                                case "7:30pm":
                                    deliveryTimeHour = "19:30";
                                    break;
                                case "8pm":
                                    deliveryTimeHour = "20:00";
                                    break;
                                case "8:30pm":
                                    deliveryTimeHour = "20:30";
                                    break;
                                case "9pm":
                                    deliveryTimeHour = "21:00";
                                    break;
                                case "9:30pm":
                                    deliveryTimeHour = "21:30";
                                    break;
                                case "10pm":
                                    deliveryTimeHour = "22:00";
                                    break;
                            }
                return deliveryTimeHour;
            })();

      var deliveryDate = new Date(b.order_delivery_slot.split('-')[0] + currentDate.getFullYear() + " " + deliveryTimeValue);


      if (currentDate.getTime() > deliveryDate.getTime()) {
        deliveryDate = new Date(b.order_delivery_slot.split('-')[0] + (currentDate.getFullYear() + 1));
      }

      // for same day delivery
      if (b.same_day_delivery === 'yes' && b.event_name != 'addToBasket') {
        b.order_lead_time = '0';
        
        // for other delivery dates
      } 
      else if (b.same_day_delivery != 'yes' && b.event_name != 'addToBasket') 
      
      {
        b.order_lead_time = (Math.floor((deliveryDate.getTime() - currentDate.getTime()) / 86400000)).toString();
      }
      
      }

    }
  } else if (digitalData.existingOrder) {
    b.order_amend = JSON.stringify(digitalData.existingOrder);
    window.localStorage.setItem('previous_order', b.order_amend);
  }
}
