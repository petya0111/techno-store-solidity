// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

error BlankField();
error IllegalQuantityInput();
error OutOfStock();
error AlreadyOwnedProduct();
error ExpiredWarrantyProduct();
error NotBoughtProductFromUser();
error ProductIDNotFound();
error ProductAlreadyExisting();
error InsuffictientAmountPrice();
error IllegalPriceInput();
error CannotRemoveProductBoughtFromUser();
error TechnoProductValidityInProgress(uint256 productId);

/// @author Petya Marinova
/// @notice Techno Lime Store contract
/// @notice Allows buying products from the store and returning it in a certain warranty time
/// @notice Implementation with real buying of a product and returning the money if the product is returned.
contract TechnoLimeStoreContract is Ownable {
    struct Product {
        string name;
        uint32 quantity;
        uint256 price;
        bool buyable;
        uint256 claimableFunds;
    }
    uint256 public itemCount;

    mapping(uint256 => Product) public productLedger;
    mapping(string => bool) private productNameExists;
    mapping(address => mapping(uint256 => uint256)) public productValidity;
    mapping(address => mapping(uint256 => uint32))
        private quantityOwnerFromUser;

    event TechnoProductAdded(string indexed name, uint32 indexed quantity);
    event TechnoProductQuantityIncrease(uint256 productId, uint256 quantity);
    event TechnoProductQuantityDecrease(uint256 productId, uint256 quantity);
    event TechnoProductChangedPrice(uint256 productId, uint256 price);
    event TechnoProductRemoved(uint256 indexed productId);
    event PaymentWithdrawn(uint256 price, uint256 productId);
    event TechnoProductBought(
        uint256 indexed productId,
        uint256 indexed datePurchased,
        address indexed user
    );
    event TechnoProductReturned(uint256 productId);

    modifier checkProductIdAvailable(uint256 productId) {
        if (productId > itemCount) {
            revert ProductIDNotFound();
        }
        _;
    }

    /// @notice Function for adding new products, name must be unique. Only owner of the contract can add products.
    /// @param _name Name of the product
    /// @param _quantity Quantity of the product added in the store
    /// @param price List price for the product
    function addNewProduct(
        string calldata _name,
        uint32 _quantity,
        uint256 price
    ) external onlyOwner {
        if (bytes(_name).length == 0) {
            revert BlankField();
        }
        if (_quantity == 0) {
            revert IllegalQuantityInput();
        }
        if (productNameExists[_name]) {
            revert ProductAlreadyExisting();
        }
        itemCount++;
        productLedger[itemCount] = Product(_name, _quantity, price, true, 0);
        productNameExists[_name] = true;
        emit TechnoProductAdded(_name, _quantity);
    }

    /// @notice Allows admin removing products
    function removeProduct(uint256 productId)
        external
        onlyOwner
        checkProductIdAvailable(productId)
    {
        if (!productLedger[productId].buyable) {
            revert CannotRemoveProductBoughtFromUser();
        }
        delete productLedger[productId];
        emit TechnoProductRemoved(productId);
    }

    /// @notice Allows admin increasing quantity of product
    function increaseProductQuantity(uint256 productId, uint32 _quantity)
        external
        onlyOwner
        checkProductIdAvailable(productId)
    {
        uint32 qLedger = productLedger[productId].quantity;
        qLedger += _quantity;
        emit TechnoProductQuantityIncrease(productId, qLedger);
    }

    /// @notice Allows admin decreasing quantity of product
    function decreaseProductQuantity(uint256 productId, uint32 _quantity)
        external
        onlyOwner
        checkProductIdAvailable(productId)
    {
        uint32 storedQuantity = productLedger[productId].quantity;
        if (storedQuantity < _quantity) {
            revert IllegalQuantityInput();
        }
        storedQuantity -= _quantity;
        emit TechnoProductQuantityDecrease(productId, storedQuantity);
    }

    /// @notice Allows admin changing price of the product
    function changePrice(uint256 productId, uint256 _price)
        external
        onlyOwner
        checkProductIdAvailable(productId)
    {
        if (_price == 0) {
            revert IllegalPriceInput();
        }
        productLedger[productId].price = _price;
        emit TechnoProductChangedPrice(productId, _price);
    }

    /// @notice Allows admin withdrawing payed amount for the bought product
    function withdrawPayment(uint256 productId)
        external
        payable
        onlyOwner
        checkProductIdAvailable(productId)
    {
        Product memory storedProduct = productLedger[productId];
        (bool callSuccess, ) = payable(msg.sender).call{
            value: storedProduct.claimableFunds
        }("");
        require(callSuccess, "Call failed");
        storedProduct.claimableFunds = 0;
        emit PaymentWithdrawn(storedProduct.price, productId);
    }

    /// @notice Function for buying a product by id. When product is bought a validity/warranty block number is set.
    function buyProduct(uint256 productId, uint32 _quantity)
        external
        payable
        checkProductIdAvailable(productId)
    {
        if (quantityOwnerFromUser[msg.sender][productId] != 0) {
            revert AlreadyOwnedProduct();
        }
        Product storage product = productLedger[productId];
        if (product.quantity < _quantity) {
            revert OutOfStock();
        }
        uint256 calculatedPrice = product.price * _quantity;
        if (msg.value != calculatedPrice) {
            revert InsuffictientAmountPrice();
        }
        productValidity[msg.sender][productId] = block.number;
        quantityOwnerFromUser[msg.sender][productId] += _quantity;
        product.buyable = false;
        product.quantity -= _quantity;
        product.claimableFunds += calculatedPrice;
        emit TechnoProductBought(
            productId,
            productValidity[msg.sender][productId],
            msg.sender
        );
    }

    /// @notice Function for returning a product by id. The quantity increases with returned input of quantity.
    function returnProduct(uint256 productId, uint32 _quantity)
        external
        payable
        checkProductIdAvailable(productId)
    {
        if (quantityOwnerFromUser[msg.sender][productId] == 0) {
            revert NotBoughtProductFromUser();
        }
        if ((block.number - productValidity[msg.sender][productId]) > 100) {
            revert ExpiredWarrantyProduct();
        }
        Product storage product = productLedger[productId];
        product.quantity += _quantity;
        productValidity[msg.sender][productId] = 0;
        quantityOwnerFromUser[msg.sender][productId] -= _quantity;
        (bool callSuccess, ) = payable(msg.sender).call{value: msg.value}("");
        require(callSuccess, "Call failed");
        emit TechnoProductReturned(productId);
    }

    function getProductCount() external view returns (uint256) {
        return itemCount;
    }

    /// @notice Function for get the product details from productId
    function getProductDetail(uint256 _id)
        external
        view
        returns (
            string memory,
            uint32,
            uint256,
            bool
        )
    {
        return (
            productLedger[_id].name,
            productLedger[_id].quantity,
            productLedger[_id].price,
            productLedger[_id].buyable
        );
    }

    /// @notice Function for having information about product block time validity
    function getProductValidity(uint256 uid) external view returns (uint256) {
        return productValidity[msg.sender][uid];
    }

    /// @notice Function for for checking if user alredy owns a quantity of a product
    function ownedQuantityFromUser(uint256 uid)
        external
        view
        returns (uint256)
    {
        return quantityOwnerFromUser[msg.sender][uid];
    }
}
