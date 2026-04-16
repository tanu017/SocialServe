import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/common/DashboardLayout';
import { createDonation, getDonationById, updateDonation } from '../../services/postService';
import { useSocket } from '../../context/SocketContext';

const categories = ['food', 'clothing', 'furniture', 'electronics', 'medical', 'books', 'other'];
const conditions = ['new', 'good', 'fair'];

const initialFormState = {
  title: '',
  description: '',
  category: '',
  quantity: '',
  unit: '',
  condition: '',
  location: {
    city: '',
    state: '',
    pincode: ''
  },
  pickupAvailable: false,
  deliveryAvailable: false,
  images: [],
  tags: []
};

const normalizeImages = (images = []) =>
  images
    .map((image, index) => {
      const url = typeof image === 'string' ? image : image?.url;
      if (!url) return null;
      return {
        id: `existing-${index}-${url}`,
        type: 'existing',
        url
      };
    })
    .filter(Boolean);

const getErrorClass = (hasError) =>
  `w-full rounded-lg border px-3 py-2 text-sm outline-none ${
    hasError ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-green-500'
  }`;

const buildSidebarLinks = (unreadCount) => [
  { label: 'Overview', to: '/dashboard/donator', icon: 'grid' },
  { label: 'My Posts', to: '/dashboard/donator/posts', icon: 'list' },
  { label: 'Create Post', to: '/dashboard/donator/posts/new', icon: 'plus' },
  { label: 'Messages', to: '/dashboard/donator/messages', icon: 'chat', badge: unreadCount }
];

export default function DonationPostFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { unreadCount } = useSocket();

  const isEditMode = location.pathname.includes('/dashboard/donator/posts/edit/') && !!id;
  const sidebarLinks = useMemo(() => buildSidebarLinks(unreadCount), [unreadCount]);

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [isDragging, setIsDragging] = useState(false);

  const imagesRef = useRef([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    imagesRef.current = formData.images;
  }, [formData.images]);

  useEffect(
    () => () => {
      imagesRef.current.forEach((image) => {
        if (image?.type === 'new' && image?.url) {
          URL.revokeObjectURL(image.url);
        }
      });
    },
    []
  );

  useEffect(() => {
    if (!isEditMode || !id) return;

    const loadDonation = async () => {
      try {
        const response = await getDonationById(id);
        const post = response?.data?.data || response?.data || {};
        setFormData({
          title: post?.title || '',
          description: post?.description || '',
          category: post?.category || '',
          quantity: post?.quantity ? String(post.quantity) : '',
          unit: post?.unit || '',
          condition: post?.condition || '',
          location: {
            city: post?.location?.city || '',
            state: post?.location?.state || '',
            pincode: post?.location?.pincode || ''
          },
          pickupAvailable: Boolean(post?.pickupAvailable),
          deliveryAvailable: Boolean(post?.deliveryAvailable),
          images: normalizeImages(post?.images),
          tags: Array.isArray(post?.tags) ? post.tags : []
        });
      } catch (error) {
        console.error('Failed to load donation post:', error);
        toast.error('Failed to load donation post');
        navigate('/dashboard/donator/posts');
      } finally {
        setLoading(false);
      }
    };

    loadDonation();
  }, [id, isEditMode, navigate]);

  const addFilesToImages = (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const remaining = 6 - formData.images.length;
    if (remaining <= 0) {
      toast.error('Maximum 6 images allowed');
      return;
    }

    const acceptedFiles = files.slice(0, remaining);
    if (files.length > remaining) {
      toast.error(`Only ${remaining} image${remaining > 1 ? 's' : ''} can be added`);
    }

    const nextImages = acceptedFiles.map((file, index) => ({
      id: `new-${Date.now()}-${index}`,
      type: 'new',
      file,
      url: URL.createObjectURL(file)
    }));

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...nextImages]
    }));
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    addFilesToImages(event.dataTransfer.files);
  };

  const handleRemoveImage = (imageId) => {
    setFormData((prev) => {
      const imageToRemove = prev.images.find((image) => image.id === imageId);
      if (imageToRemove?.type === 'new' && imageToRemove?.url) {
        URL.revokeObjectURL(imageToRemove.url);
      }
      return {
        ...prev,
        images: prev.images.filter((image) => image.id !== imageId)
      };
    });
  };

  const addTag = (rawTag) => {
    const tag = rawTag.trim();
    if (!tag) return;

    setFormData((prev) => {
      const exists = prev.tags.some((existingTag) => existingTag.toLowerCase() === tag.toLowerCase());
      if (exists) return prev;
      return { ...prev, tags: [...prev.tags, tag] };
    });
    setTagInput('');
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.title.trim()) nextErrors.title = 'Title is required';
    if (!formData.description.trim()) nextErrors.description = 'Description is required';
    if (!formData.category) nextErrors.category = 'Category is required';
    if (!formData.quantity || Number(formData.quantity) < 1) nextErrors.quantity = 'Quantity is required';
    if (!formData.unit.trim()) nextErrors.unit = 'Unit is required';
    if (!formData.condition) nextErrors.condition = 'Condition is required';
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = new FormData();
    payload.append('title', formData.title.trim());
    payload.append('description', formData.description.trim());
    payload.append('category', formData.category);
    payload.append('quantity', String(formData.quantity));
    payload.append('unit', formData.unit.trim());
    payload.append('condition', formData.condition);
    payload.append('pickupAvailable', String(formData.pickupAvailable));
    payload.append('deliveryAvailable', String(formData.deliveryAvailable));
    payload.append('location[city]', formData.location.city.trim());
    payload.append('location[state]', formData.location.state.trim());
    payload.append('location[pincode]', formData.location.pincode.trim());
    payload.append('tags', JSON.stringify(formData.tags));

    formData.images
      .filter((image) => image.type === 'new' && image.file)
      .forEach((image) => payload.append('images', image.file));

    const existingImages = formData.images
      .filter((image) => image.type === 'existing')
      .map((image) => image.url);
    payload.append('existingImages', JSON.stringify(existingImages));

    setSubmitting(true);
    try {
      if (isEditMode && id) {
        await updateDonation(id, payload);
        toast.success('Post updated!');
      } else {
        await createDonation(payload);
        toast.success('Post created!');
      }
      navigate('/dashboard/donator/posts');
    } catch (error) {
      console.error('Donation form submit failed:', error);
      toast.error(error?.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const imageLimitReached = formData.images.length >= 6;

  if (loading) {
    return (
      <DashboardLayout sidebarLinks={sidebarLinks} pageTitle={isEditMode ? 'Edit Donation Post' : 'Create Donation Post'}>
        <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-6">
          <div className="space-y-4 animate-pulse">
            <div className="h-6 w-1/3 rounded bg-gray-200" />
            <div className="h-10 w-full rounded bg-gray-100" />
            <div className="h-24 w-full rounded bg-gray-100" />
            <div className="h-10 w-full rounded bg-gray-100" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} pageTitle={isEditMode ? 'Edit Donation Post' : 'Create Donation Post'}>
      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-6">
        <section className="mb-6">
          <h2 className="mb-3 text-base font-semibold text-gray-900">Basic Info</h2>
          <div className="space-y-3">
            <div>
              <input
                type="text"
                value={formData.title}
                onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="e.g. 50 Winter Blankets"
                className={getErrorClass(errors.title)}
                required
              />
              {errors.title ? <p className="mt-1 text-xs text-red-500">{errors.title}</p> : null}
            </div>
            <div>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                className={getErrorClass(errors.description)}
                required
              />
              {errors.description ? <p className="mt-1 text-xs text-red-500">{errors.description}</p> : null}
            </div>
            <div>
              <select
                value={formData.category}
                onChange={(event) => setFormData((prev) => ({ ...prev, category: event.target.value }))}
                className={getErrorClass(errors.category)}
                required
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category ? <p className="mt-1 text-xs text-red-500">{errors.category}</p> : null}
            </div>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="mb-3 text-base font-semibold text-gray-900">Item Details</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <input
                type="number"
                min={1}
                value={formData.quantity}
                onChange={(event) => setFormData((prev) => ({ ...prev, quantity: event.target.value }))}
                className={getErrorClass(errors.quantity)}
                required
              />
              {errors.quantity ? <p className="mt-1 text-xs text-red-500">{errors.quantity}</p> : null}
            </div>
            <div>
              <input
                type="text"
                placeholder="e.g. pcs, kg, boxes"
                value={formData.unit}
                onChange={(event) => setFormData((prev) => ({ ...prev, unit: event.target.value }))}
                className={getErrorClass(errors.unit)}
                required
              />
              {errors.unit ? <p className="mt-1 text-xs text-red-500">{errors.unit}</p> : null}
            </div>
          </div>
          <div className="mt-3">
            <p className="mb-2 text-sm font-medium text-gray-700">Condition</p>
            <div className="flex flex-wrap gap-3">
              {conditions.map((condition) => {
                const active = formData.condition === condition;
                const colorClass =
                  condition === 'new'
                    ? 'border-blue-300 text-blue-700'
                    : condition === 'good'
                      ? 'border-green-300 text-green-700'
                      : 'border-amber-300 text-amber-700';
                return (
                  <label
                    key={condition}
                    className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm ${
                      active ? colorClass : 'border-gray-300 text-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="condition"
                      value={condition}
                      checked={active}
                      onChange={(event) => setFormData((prev) => ({ ...prev, condition: event.target.value }))}
                      className="sr-only"
                      required
                    />
                    {condition}
                  </label>
                );
              })}
            </div>
            {errors.condition ? <p className="mt-1 text-xs text-red-500">{errors.condition}</p> : null}
          </div>
        </section>

        <section className="mb-6">
          <h2 className="mb-3 text-base font-semibold text-gray-900">Logistics</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <input
              type="text"
              placeholder="City"
              value={formData.location.city}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  location: { ...prev.location, city: event.target.value }
                }))
              }
              className={getErrorClass(false)}
            />
            <input
              type="text"
              placeholder="State"
              value={formData.location.state}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  location: { ...prev.location, state: event.target.value }
                }))
              }
              className={getErrorClass(false)}
            />
            <input
              type="text"
              placeholder="Pincode"
              value={formData.location.pincode}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  location: { ...prev.location, pincode: event.target.value }
                }))
              }
              className={getErrorClass(false)}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <span>Pickup Available</span>
              <input
                type="checkbox"
                checked={formData.pickupAvailable}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, pickupAvailable: event.target.checked }))
                }
                className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-gray-300 checked:bg-green-500 relative before:absolute before:left-0.5 before:top-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-transform checked:before:translate-x-4"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <span>Delivery Available</span>
              <input
                type="checkbox"
                checked={formData.deliveryAvailable}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, deliveryAvailable: event.target.checked }))
                }
                className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-gray-300 checked:bg-green-500 relative before:absolute before:left-0.5 before:top-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-transform checked:before:translate-x-4"
              />
            </label>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="mb-3 text-base font-semibold text-gray-900">Images (max 6)</h2>
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`rounded-lg border-2 border-dashed p-5 text-center ${
              isDragging ? 'border-green-400 bg-green-50' : 'border-gray-300'
            }`}
          >
            <p className="mb-3 text-sm text-gray-600">Drag and drop images here, or click to browse</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageLimitReached}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Browse Images
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => {
                addFilesToImages(event.target.files);
                event.target.value = '';
              }}
              disabled={imageLimitReached}
            />
          </div>

          {formData.images.length > 0 ? (
            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {formData.images.map((image) => (
                <div key={image.id} className="relative">
                  <img src={image.url} alt="Upload preview" className="h-20 w-full rounded object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(image.id)}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs text-white"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <section className="mb-6">
          <h2 className="mb-3 text-base font-semibold text-gray-900">Tags</h2>
          <input
            type="text"
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ',') {
                event.preventDefault();
                addTag(tagInput);
              }
            }}
            onBlur={() => addTag(tagInput)}
            placeholder="Type a tag and press Enter or comma"
            className={getErrorClass(false)}
          />
          {formData.tags.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        tags: prev.tags.filter((existingTag) => existingTag !== tag)
                      }))
                    }
                    className="text-green-700"
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </section>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard/donator/posts')}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Saving...
              </>
            ) : isEditMode ? (
              'Save Changes'
            ) : (
              'Post Donation'
            )}
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}
